import {
    appendFile
} from 'fs';
import {
    copy,
    remove
} from 'fs-extra';
import {
    delay
} from '../src/PromiseUtil';
import {
    findFiles
} from '../src/FsUtil';
import CompilerAdapter from '../src/CompilerAdapter';

describe('CompilerAdapter', () => {
    const mock = {
        callback() {}
    };

    beforeEach(() => {
        spyOn(mock, 'callback').and.callFake(() => {});
        spyOn(console, 'log').and.callFake(() => {});
        spyOn(process.stdout, 'write').and.callFake(() => {});
    });

    describe('#run()', () => {
        it('should not run successfully', done => {
            const adapter = new CompilerAdapter({
                dryRun: true,
                failures: false
            });

            adapter.run([
                './test/fixtures/config-*.js'
            ], mock.callback).then(() => {
                expect(mock.callback.calls.count()).toEqual(5);

                done();
            });
        });

        it('should not run successfully', done => {
            const adapter = new CompilerAdapter({
                dryRun: true,
                failures: true
            });

            adapter.run([
                './test/fixtures/config-*.js'
            ], mock.callback).catch(() => {
                expect(mock.callback.calls.count()).toEqual(5);

                done();
            });
        });
    });

    describe('#watch()', () => {
        function updateFile(filename) {
            return delay(100).then(() => {
                return new Promise(resolve => {
                    appendFile(filename, `// Modified at ${new Date()}\n`, resolve);
                });
            });
        }

        beforeAll(done => copy('./test/fixtures', './test/tmp', done));

        afterAll(done => remove('./test/tmp', done));

        it('should watch successfully', done => {
            const adapter = new CompilerAdapter({
                dryRun: true,
                failures: false
            });

            adapter.watch([
                './test/tmp/config-*.js'
            ], () => {
                mock.callback();

                if (mock.callback.calls.count() >= 10) {
                    adapter.closeAll().then(() => done());
                }
            }).then(() => {
                return findFiles([
                    './test/tmp/config-*.js'
                ]).then(files => {
                    const updateFiles = () => files.map(filename => updateFile(filename));

                    return Promise.all(updateFiles()).then(() => {
                        return Promise.all(updateFiles())
                    });
                });
            });
        });
    });
});
