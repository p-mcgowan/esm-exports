/* eslint-disable @typescript-eslint/tslint/config */
import * as assert from 'assert';
import { Entry } from './entry';
import { module as parseModule } from './module';
import { parse as parseSource } from './parse';
import { file as parseFile } from './file';
const pkgDir = require('pkg-dir');
const rootPath = pkgDir.sync();

it.only('fs readFileSync', () => {
    const source = `
    declare module "fs" {
        namespace access {
            function __promisify__();
        }
        function readFileSync();
    }
    `;
    const result = parseSource(source, { module: '@types/node' });
    // console.log("result", result);
    assert(result.find(e => e.module === 'fs' && e.name === 'readFileSync'));
});
