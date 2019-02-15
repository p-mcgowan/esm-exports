import * as ts from 'typescript';
import { Entry } from './entry';

type WalkNodeOptions = {
    module?: string;
    result: Entry[];
};

export function main(sourceText: string, options: WalkNodeOptions = { result: [] }): Entry[] {
    const sourceFile = ts.createSourceFile('dummy.ts', sourceText, ts.ScriptTarget.ESNext, true);
    ts.forEachChild<ts.Node>(sourceFile, (node: any) => {
        walkNode(node, options);
        return undefined;
    });
    return options.result;
}

function walkNode(node: ts.Node, options: WalkNodeOptions): any {
    // console.log("node.kind", node.kind);
    if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
        if (hasDeclareKeyword(node)) {
            const moduleBlock = node.getChildren().find(c => c.kind === ts.SyntaxKind.ModuleBlock) as ts.Block | undefined;
            if (!moduleBlock) {
                return;
            }
            const declaredModule = (node as any).name.text;
            moduleBlock.forEachChild(node => walkNode(node, { ...options, module: declaredModule }));
        } else if (options.module) {
            options.result.push(new Entry({ ...options, name: (node as any).name.text }));
        }
    } else if (node.kind === ts.SyntaxKind.ExportDeclaration) {
        const specifier = ((node as ts.ExportDeclaration).moduleSpecifier as any);
        if (specifier) {
            options.result.push(new Entry({ ...options, specifier: specifier.text }));
        }
    } else if (node.kind === ts.SyntaxKind.VariableDeclarationList && node.parent && hasExportModifier(node.parent)) {
        (node as any).declarations.forEach(d => {
            if (d.name.kind === ts.SyntaxKind.Identifier) {
                options.result.push(new Entry({ ...options, name: d.name.text }));
            } else if (d.name.kind === ts.SyntaxKind.ObjectBindingPattern) {
                d.name.elements.forEach(element => {
                    options.result.push(new Entry({ ...options, name: element.name.text }));
                });
            }
        });
    } else if (node.kind === ts.SyntaxKind.ExportSpecifier) {
        options.result.push(new Entry({ ...options, name: (node as any).name.text }));
    } else if (node.kind === ts.SyntaxKind.ExportAssignment) {
        const name = (node as any).expression.text;
        options.result.push(new Entry({ ...options, name, isDefault: true }));
    } else if ((
        node.kind === ts.SyntaxKind.FunctionDeclaration
        || node.kind === ts.SyntaxKind.InterfaceDeclaration
        || node.kind === ts.SyntaxKind.ClassDeclaration
    ) && (options.module != null || hasExportModifier(node))) {
        const isDefault = /*node.kind === ts.SyntaxKind.ExportAssignment || */ hasDefaultModifier(node);
        options.result.push(new Entry({ ...options, name: (node as any).name.text, isDefault }));
    }
    // else if (node.kind === ts.SyntaxKind.Identifier) {
    //     const name = (node as ts.Identifier).text;
    //     const statement = getParentIf(node, [
    //         ts.SyntaxKind.VariableStatement,
    //         ts.SyntaxKind.InterfaceDeclaration,
    //         ts.SyntaxKind.FunctionDeclaration,
    //         ts.SyntaxKind.ExportDeclaration,
    //         ts.SyntaxKind.ExportAssignment,
    //         ts.SyntaxKind.ClassDeclaration,
    //     ]);
    //     if (statement && (
    //         statement.kind === ts.SyntaxKind.ExportDeclaration
    //         || statement.kind === ts.SyntaxKind.ExportAssignment
    //         || hasExportModifier(statement)
    //         || options.module != null
    //     )) {
    //         const isDefault = statement.kind === ts.SyntaxKind.ExportAssignment
    //             || hasDefaultModifier(statement);
    //         // const cjs = (statement as any).isExportEquals === true;
    //         options.result.push(new Entry({ ...options, name, isDefault }));
    //     }
    // }
    // todo: Check depth
    node.forEachChild(node => walkNode(node, options));
}

function getParentIf(node: ts.Node, syntaxKinds: ts.SyntaxKind[]) {
    if (node && node.parent && syntaxKinds.includes(node.parent.kind)) {
        return node.parent;
    }
    return undefined;
}

function hasExportModifier(node: ts.Node): boolean {
    const result = node.modifiers && node.modifiers.find(m => m.kind === ts.SyntaxKind.ExportKeyword);
    return result !== undefined;
}

function hasDefaultModifier(node: ts.Node): boolean {
    const result = node.modifiers && node.modifiers.find(m => m.kind === ts.SyntaxKind.DefaultKeyword);
    return result !== undefined;
}

function hasDeclareKeyword(node: ts.Node): boolean {
    return node.modifiers && node.modifiers.find(m => m.kind === ts.SyntaxKind.DeclareKeyword) !== undefined
}
