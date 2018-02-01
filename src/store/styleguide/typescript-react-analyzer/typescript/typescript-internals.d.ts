import * as ts from 'typescript';

declare module 'typescript' {
	interface TypeChecker {
		isArrayLikeType(type: Type): boolean;
	}

	interface Symbol {
		type?: Type;
	}
}
