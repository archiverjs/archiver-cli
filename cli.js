#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const archiver = require('archiver');
const getStdin = require('get-stdin');
const globby = require('globby');
const meow = require('meow');
const ora = require('ora');

const cli = meow({
      help: `
	Usage
	  $ archiverjs <path|glob> --out-file=output.zip [--format=zip|tar|json]

	Options
		-f, --archive-format Set the archive format.
			Archive format can be set to:
				tar - just your everyday tarball
				zip - This is the default format.
				json - great for debugging
		-o, --out-file Output file
	  -Z, --compression-method Set the default compression method. Currently the main methods supported by zip are store and deflate.
	  	Compression method can be set to:
				store - Setting the compression method to store forces zip to store entries with no compression.
				deflate - This is the default method for zip.

	Examples
	  $ archiverjs images/* --out-file=images.zip
`,
        autoVersion: process.argv.indexOf('--no-auto-version') === -1,
	autoHelp: process.argv.indexOf('--no-auto-help') === -1,
        flags: {
                archiveFormat: {
                type: 'string',
                alias: 'f',
                default: 'zip'
                },
                compressionMethod: {
                type: 'string',
                alias: 'Z'
                }
                outFile: {
                type: 'string',
                alias: 'o'
                }
        }
});

var archive;
var archiveOptions = {};

const handleFile = function(input, opts) {
	archive.file(input);
	return Promise.resolve();
};

const run = function(input, opts) {
	opts = Object.assign({ compressionMethod: 'deflate' }, opts);
	const spinner = ora('Archiving');

	if (Buffer.isBuffer(input)) {
		return;
	}

	if (opts.outFile) {
		spinner.start();
	}

	if (opts.compressionMethod === 'store') {
		archiveOptions.store = true;
	}

	var output = fs.createWriteStream(opts.outFile);
	archive = archiver(opts.archiveFormat, archiveOptions);

	archive.on('error', function(err) {
		spinner.stop();
	  throw err;
	});

	archive.pipe(output);

	input.push('!' + opts.outFile);

	globby(input, {onlyFiles: true})
		.then(function(paths) {
			return Promise.all(paths.map(function(filepath) {
				return handleFile(filepath);
			}));
		})
		.then(function() {
			return archive.finalize();
		})
		.then(function() {
			spinner.stop();
			console.log(`Archive completed`);
		})
		.catch(function(err) {
			spinner.stop();
			throw err;
		});
};

if (!cli.input.length && process.stdin.isTTY) {
	console.error('Specify at least one filename');
	process.exit(1);
}

if (cli.input.length) {
	run(cli.input, cli.flags);
} else {
	getStdin.buffer().then(function(buf) {
		return run(buf, cli.flags);
	});
}
