#!/usr/bin/env node
"use strict";
const fs = require("fs");
const archiver = require("archiver");
const getStdin = require("get-stdin");
const globby = require("globby");
const meow = require("meow");
const ora = require("ora");

const cli = meow({
  help: `
		Usage
		$ archiverjs <path|glob> --out-file=output.zip [--format=zip|tar|json] [--compression-method=deflate|store]

		Options
			-f, --archive-format Set the archive format.
				Archive format can be set to:
					zip - This is the default format
					tar - just your everyday tarball
					json - great for debugging
			-o, --out-file Output file
			-Z, --compression-method Set the default compression method. Currently the main methods supported by zip are store and deflate.
				Compression method can be set to:
					deflate - This is the default method for zip
					store - Setting the compression method to store forces zip to store entries with no compression
						
		Examples
		$ archiverjs images/* --out-file=images.zip
  `,
  input: [],
  flags: {
    archiveFormat: {
      type: "string",
      alias: "f",
      default: "zip",
    },
    compressionMethod: {
      type: "string",
      alias: "Z",
      default: "deflate",
    },
    outFile: {
      type: "string",
      alias: "o",
      isRequired: true,
    },
  },
});

const run = function (input) {
  const spinner = ora("Archiving");
  spinner.start();

  const output = fs.createWriteStream(cli.flags.outFile);
  const archive = archiver(cli.flags.archiveFormat, {
    store: cli.flags.compressionMethod === "store",
  });

  archive.on("error", function (err) {
    spinner.stop();
    throw err;
  });

  archive.pipe(output);

  if (Buffer.isBuffer(input)) {
    archive.append(input, {
      name: "input.txt",
    });
  } else {
    input.forEach(function (path) {
      archive.file(path);
    });
  }

  archive
    .finalize()
    .then(function () {
      spinner.stop();
      console.log(`Archive completed`);
    })
    .catch(function (err) {
      spinner.stop();
      throw err;
    });
};

if (Array.isArray(cli.input) && cli.input.length > 0) {
  globby(cli.input, { onlyFiles: true, ignore: [cli.flags.outFile] }).then(
    function (paths) {
      if (paths.length === 0) {
        throw new Error('No files matched: "' + cli.input.join(", ") + '"');
      }

      run(paths);
    }
  );
} else {
  getStdin.buffer().then(function (buf) {
    run(buf);
  });
}
