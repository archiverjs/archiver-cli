import {promisify} from 'util';
import fs from 'fs';
import execa from 'execa';
import test from 'ava';

process.chdir(__dirname);

if (!fs.existsSync(__dirname + '/tmp')) {
	fs.mkdirSync(__dirname + '/tmp');
}

const readFile = promisify(fs.readFile);

test('show version', async t => {
	const {stdout} = await execa('./cli.js', ['--version']);
	t.is(stdout, require('./package.json').version);
});

test('zip with file path', async t => {
	const {stdout} = await execa('./cli.js', ['fixtures/test.txt', '--out-file=tmp/zip-file-path.zip']);

	t.fail();
});

test('zip with glob', async t => {
	const {stdout} = await execa('./cli.js', ['fixtures/*', '--out-file=tmp/zip-glob.zip']);

	t.fail();
});