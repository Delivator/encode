import {runFFmpegAndCleanup, ProgressReporter} from './ffmpeg';
import {AudioData} from 'ffprobe-normalized';
import {SaveAsPathOptions} from '@drovp/save-as-path';

export type From = number;
export type To = number;
export type ResultPath = string;

export interface AudioOptions {
	cuts?: [From, To][]; // TODO: add support for this
	codec: 'mp3' | 'opus';

	mp3: {
		mode: 'vbr' | 'cbr';
		vbr: number; // 0: best, 9: worst
		cbrpch: number; // Kbit/s/ch
		compression_level: number; // 0: high quality/slow, 9: low quality/fast
	};

	opus: {
		mode: 'cbr' | 'vbr' | 'cvbr';
		bpch: number; // Kbit/s/ch
		compression_level: number; // 0 - low quality/fast, 10 - high quality/slow
		application: 'voip' | 'audio' | 'lowdelay';
	};

	minSavings: number;
	skipThreshold: number | null;
}

export interface ProcessOptions {
	onLog: (message: string) => void;
	onWarning: (message: string) => void;
	onProgress: ProgressReporter;
	cwd: string;
}

export async function processAudio(
	ffmpegPath: string,
	input: AudioData,
	options: AudioOptions,
	savingOptions: SaveAsPathOptions,
	processOptions: ProcessOptions
): Promise<ResultPath | undefined> {
	const args: (string | number)[] = [];
	let outputType: 'mp3' | 'ogg';

	// Input file
	args.push('-i', input.path);

	// Encoder configuration
	if (options.codec === 'opus') {
		outputType = 'ogg';
		args.push('-c:a', 'opus');

		// FFmpeg doesn't support muxing cover arts into ogg files: https://trac.ffmpeg.org/ticket/4448
		// Until that is fixed, we need to drop the cover, or it creates a file that some players choke on.
		args.push('-vn');

		switch (options.opus.mode) {
			case 'vbr':
				args.push('-vbr', 'on');
				break;
			case 'cvbr':
				args.push('-vbr', 'constrained');
				break;
			default:
				args.push('-vbr', 'off');
		}

		args.push('-b:a', `${options.opus.bpch * input.channels}k`);

		args.push('-compression_level', options.opus.compression_level);
		args.push('-application', options.opus.application);
	} else {
		outputType = 'mp3';
		args.push('-c:a', 'libmp3lame');

		// Quality/bitrate
		if (options.mp3.mode === 'vbr') args.push('-q:a', options.mp3.vbr);
		else args.push('-b:a', `${options.mp3.cbrpch * input.channels}k`);

		args.push('-compression_level', options.mp3.compression_level);

		// Ensure album art gets copied over
		args.push('-c:v', 'copy');
		args.push('-id3v2_version', '3');
	}

	// Enforce output type
	args.push('-f', outputType);

	// Calculate KBpCHpM and check if we can skip encoding this file
	const skipThreshold = options.skipThreshold;

	if (skipThreshold) {
		const KB = input.size / 1024;
		const minutes = input.duration / 1000 / 60;
		const KBpCHpM = KB / input.channels / minutes;

		if (skipThreshold > KBpCHpM) {
			processOptions.onLog(
				`Audio's ${Math.round(KBpCHpM)} KB/ch/m bitrate is smaller than skip threshold, skipping encoding.`
			);

			return input.path;
		}
	}

	// Finally, encode the file
	return await runFFmpegAndCleanup({
		item: input,
		ffmpegPath,
		args,
		codec: options.codec,
		outputExtension: outputType,
		savingOptions,
		minSavings: options.minSavings,
		...processOptions,
	});
}
