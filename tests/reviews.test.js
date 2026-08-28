// Runs reviews against throwaway git repositories with real commit histories.

'use strict';

const assert = require('node:assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Builds a repository with one commit per entry of `steps`, each a map of file
// to content. Returns its path.
function repository(steps) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reviews-'));
    const run = (args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' });

    run(['init', '-q']);
    run(['config', 'user.email', 'test@example.org']);
    run(['config', 'user.name', 'A Person']);

    for (const files of steps) {
        for (const [name, content] of Object.entries(files)) {
            fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
            fs.writeFileSync(path.join(dir, name), content);
        }
        run(['add', '-A']);
        run(['commit', '-qm', 'step']);
    }
    return dir;
}

// Runs reviews in a repository and returns { exit, stdout, stderr }. stdout is
// not a terminal here, so show emits Markdown.
function reviews(dir, args) {
    try {
        return { exit: 0, stdout: execFileSync('reviews', args,
            { cwd: dir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }), stderr: '' };
    } catch (error) {
        return { exit: error.status, stdout: error.stdout || '', stderr: error.stderr || '' };
    }
}

const move = (dir, from, to) => {
    execFileSync('git', ['mv', from, to], { cwd: dir });
    execFileSync('git', ['commit', '-qm', 'rename'], { cwd: dir });
};

describe('reviews', function () {
    it('reports a file nobody has recorded reading as unread', function () {
        const dir = repository([{ 'a.txt': 'one\n' }]);
        const { stdout } = reviews(dir, ['show']);
        assert.match(stdout, /❌ \| `a\.txt`/);
    });

    it('reports a file as current when nothing has changed since the reading', function () {
        const dir = repository([{ 'a.txt': 'one\n' }]);
        reviews(dir, ['record', 'a.txt']);
        const { stdout } = reviews(dir, ['show']);
        assert.match(stdout, /✅ \| `a\.txt` \| A Person/);
        assert.match(stdout, /unchanged/);
    });

    it('reports how much has changed since the reading', function () {
        const dir = repository([{ 'a.txt': 'one\n' }]);
        reviews(dir, ['record', 'a.txt']);
        fs.writeFileSync(path.join(dir, 'a.txt'), 'one\ntwo\nthree\n');
        execFileSync('git', ['commit', '-qam', 'grow'], { cwd: dir });
        const { stdout } = reviews(dir, ['show']);
        assert.match(stdout, /⚠️ \| `a\.txt`/);
        assert.match(stdout, /\+2 −0 since/);
    });

    it('carries a reading across a rename', function () {
        const dir = repository([{ 'a.txt': 'one\n' }]);
        reviews(dir, ['record', 'a.txt']);
        move(dir, 'a.txt', 'moved.txt');
        const { stdout } = reviews(dir, ['show']);
        assert.match(stdout, /✅ \| `moved\.txt`/);
    });

    it('refuses to record a reading of a file with uncommitted changes', function () {
        const dir = repository([{ 'a.txt': 'one\n' }]);
        fs.writeFileSync(path.join(dir, 'a.txt'), 'edited\n');
        const { exit, stderr } = reviews(dir, ['record', 'a.txt']);
        assert.strictEqual(exit, 2);
        assert.match(stderr, /commit before recording/);
    });

    it('refuses to record a reading of a file that does not exist', function () {
        const dir = repository([{ 'a.txt': 'one\n' }]);
        const { exit, stderr } = reviews(dir, ['record', 'nope.txt']);
        assert.strictEqual(exit, 2);
        assert.match(stderr, /no such file/);
    });

    it('credits a reading to the name given', function () {
        const dir = repository([{ 'a.txt': 'one\n' }]);
        reviews(dir, ['record', 'a.txt', '--by', 'Someone Else']);
        const { stdout } = reviews(dir, ['show']);
        assert.match(stdout, /Someone Else/);
    });

    it('exempts a file declared as framework', function () {
        const dir = repository([{ 'a.txt': 'one\n' }]);
        reviews(dir, ['declare', 'a.txt', 'framework']);
        const { stdout } = reviews(dir, ['show']);
        assert.match(stdout, /⚙️ \| `a\.txt`/);
    });

    it('sends a file declared as generated to its generator', function () {
        const dir = repository([{ 'a.txt': 'one\n' }]);
        reviews(dir, ['declare', 'a.txt', 'generated']);
        const { stdout } = reviews(dir, ['show']);
        assert.match(stdout, /🛠️ \| `a\.txt`/);
    });

    it('refuses an origin it does not define', function () {
        const dir = repository([{ 'a.txt': 'one\n' }]);
        const { exit, stderr } = reviews(dir, ['declare', 'a.txt', 'invented']);
        assert.strictEqual(exit, 2);
        assert.match(stderr, /origin must be one of/);
    });

    it('lists only what wants a reader with --stale', function () {
        const dir = repository([{ 'a.txt': 'one\n', 'b.txt': 'two\n' }]);
        reviews(dir, ['record', 'a.txt']);
        const { stdout } = reviews(dir, ['show', '--stale']);
        assert.doesNotMatch(stdout, /`a\.txt`/);
        assert.match(stdout, /`b\.txt`/);
    });

    it('keeps the log append-only across several readings', function () {
        const dir = repository([{ 'a.txt': 'one\n' }]);
        reviews(dir, ['record', 'a.txt']);
        reviews(dir, ['declare', 'a.txt', 'authored']);
        reviews(dir, ['record', 'a.txt', '--by', 'Someone Else']);
        const lines = fs.readFileSync(path.join(dir, 'reviews.jsonl'), 'utf8')
            .split('\n').filter(Boolean);
        assert.strictEqual(lines.length, 3);
        assert.strictEqual(JSON.parse(lines[0]).kind, 'review');
        assert.strictEqual(JSON.parse(lines[1]).kind, 'origin');
    });

    it('refuses to run outside a git repository', function () {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'not-a-repo-'));
        assert.strictEqual(reviews(dir, ['show']).exit, 2);
    });
});
