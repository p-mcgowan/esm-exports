import * as assert from 'assert';
import { parse } from './parse';

it('smoke test', () => {
    assert(parse);
});

it('var export', async function() {
    let code = `export var aaa = 1`;
    let [result] = await parse(code);
    assert.equal(result.name, 'aaa');
});

it('several var export', async function() {
    let code = `export var aaa, bbb`;
    let [result, result2] = await parse(code);
    assert.equal(result.name, 'aaa');
    assert.equal(result2.name, 'bbb');
});

it('export all', async function() {
    let code = `export * from './provider'`;
    let [result] = await parse(code);
    assert.equal(result.specifier, './provider');
});

it('export some from module', async function() {
    let code = `export {var1} from './provider'`;
    let [result] = await parse(code);
    assert.equal(result.name, 'var1');
    assert.equal(result.specifier, './provider');
});

it('pick export', async function() {
    let code = `export { CalendarEvent, EventAction } from 'calendar-utils'`;
    var [first, second] = await parse(code);
    assert.equal(first.name, 'CalendarEvent');
    assert.equal(first.specifier, 'calendar-utils');
    assert.equal(second.name, 'EventAction');
});

it('export declare class', async function() {
    let code = `export declare class Calendar`;
    let [result] = await parse(code);
    assert.equal(result.name, 'Calendar');
});

it('export class', async function() {
    let code = `export class Aaa`;
    let [result] = await parse(code);
    assert.equal(result.name, 'Aaa');
});

it('export interface', async function() {
    let code = `export interface Entry {}`;
    let [result] = await parse(code);
    assert.equal(result.name, 'Entry');
});

it('export function', async function() {
    let code = `export function dummy() {}`;
    let [result] = await parse(code);
    assert.equal(result.name, 'dummy');
});

it('export several vars', async function() {
    let code = `export {somevar, otherVar}`;
    let [result, other] = await parse(code);
    assert.equal(result.name, 'somevar');
    assert.equal(other.name, 'otherVar');
});

it('export default', async function() {
    let code = `export default function foo() {}`;
    var [entry] = await parse(code);
    assert.equal(entry.name, 'foo');
    assert.equal(entry.isDefault, true);
});

it('empty source', async () => {
    let code = ``;
    var result = await parse(code);
    assert.deepEqual(result, []);
});

it('object binding', async () => {
    let code = `export const {ModuleStore} = $traceurRuntime;`;
    let [result1] = await parse(code);
    assert.equal(result1.name, 'ModuleStore');
});

it('declared module with inner declaration', async () => {
    let code = `declare module "events" {
    class internal extends NodeJS.EventEmitter { }

    namespace internal {
        export class EventEmitter extends internal {
        }
    }

    export = internal;
}`;
    let nodes = await parse(code);
    let [ee] = nodes.filter(n => n.name === 'EventEmitter');
    assert(ee);
    assert(ee.module === 'events');
});

it('should extract declared module http', async () => {
    let source = `declare module "http" {
        export var METHODS: string[];
        export const c1, c2: any;
    }
    export var out1: number = 1;
    `;
    let entries = await parse(source);
    let httpEntries = entries.filter(e => e.module === 'http');
    assert.equal(httpEntries.length, 3);
});

it('should parse react tsx', async () => {
    let source = `
export class AppComponent extends React.Component<any, any> {
    render() {
        return (<div>hello</div>);
    }
}
    `;
    let [entry] = await parse(source);
    assert.equal(entry.name, 'AppComponent');
});