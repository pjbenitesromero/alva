import { Property } from '../../pattern/property/property';
import * as ts from 'typescript';

import { BooleanProperty } from '../../pattern/property/boolean-property';
import { EnumProperty, Option } from '../../pattern/property/enum-property';
import { NumberArrayProperty } from '../../pattern/property/number-array-property';
import { NumberProperty } from '../../pattern/property/number-property';
import { ObjectProperty } from '../../pattern/property/object-property';
import { StringArrayProperty } from '../../pattern/property/string-array-property';
import { StringProperty } from '../../pattern/property/string-property';

export function getProperties(type: ts.Type, typechecker: ts.TypeChecker): Map<string, Property> {
	const properties = new Map<string, Property>();
	const members = type.getApparentProperties();

	members.forEach(memberSymbol => {
		if ((memberSymbol.flags & ts.SymbolFlags.Property) !== ts.SymbolFlags.Property) {
			return;
		}

		const property = createProperty(memberSymbol.name, memberSymbol, typechecker);

		if (property) {
			properties.set(property.getId(), property);
		}
	});

	return properties;
}

function createProperty(
	name: string,
	symbol: ts.Symbol,
	typechecker: ts.TypeChecker
): Property | undefined {
	const declaration = findTypeDeclaration(symbol) as ts.Declaration;

	if (!declaration) {
		return;
	}

	let type = typechecker.getTypeAtLocation(declaration);

	if (type.flags & ts.TypeFlags.Union) {
		type = (type as ts.UnionType).types[0];
	}

	const optional = (symbol.flags & ts.SymbolFlags.Optional) === ts.SymbolFlags.Optional;

	if ((type.flags & ts.TypeFlags.String) === ts.TypeFlags.String) {
		const property = new StringProperty(name);
		property.setRequired(!optional);
		return property;
	}

	if ((type.flags & ts.TypeFlags.Number) === ts.TypeFlags.Number) {
		const property = new NumberProperty(name);
		property.setRequired(!optional);
		return property;
	}

	if ((type.flags & ts.TypeFlags.BooleanLiteral) === ts.TypeFlags.BooleanLiteral) {
		const property = new BooleanProperty(name);
		property.setRequired(!optional);
		return property;
	}

	if (type.flags & ts.TypeFlags.EnumLiteral) {
		if (!(type.symbol && type.symbol.flags & ts.SymbolFlags.EnumMember)) {
			return;
		}

		const enumMemberDeclaration = findTypeDeclaration(type.symbol);

		if (!(enumMemberDeclaration && enumMemberDeclaration.parent)) {
			return;
		}

		if (!ts.isEnumDeclaration(enumMemberDeclaration.parent)) {
			return;
		}

		const property = new EnumProperty(name);
		property.setRequired(!optional);
		property.setOptions(getEnumTypeOptions(enumMemberDeclaration.parent));
		return property;
	}

	if (typechecker.isArrayLikeType(type)) {
		const arrayType: ts.GenericType = type as ts.GenericType;

		if (!arrayType.typeArguments) {
			return;
		}

		const itemType = arrayType.typeArguments[0];

		if ((itemType.flags & ts.TypeFlags.String) === ts.TypeFlags.String) {
			const property = new StringArrayProperty(name);
			property.setRequired(!optional);
			return property;
		}

		if ((itemType.flags & ts.TypeFlags.Number) === ts.TypeFlags.Number) {
			const property = new NumberArrayProperty(name);
			property.setRequired(!optional);
			return property;
		}
	}

	if (type.flags & ts.TypeFlags.Object) {
		const objectType = type as ts.ObjectType;

		if (objectType.objectFlags & ts.ObjectFlags.Interface) {
			const property = new ObjectProperty(name);
			property.setProperties(getProperties(type, typechecker));
			return property;
		}
	}

	return undefined;
}

function findTypeDeclaration(symbol: ts.Symbol): ts.Declaration | undefined {
	if (symbol.valueDeclaration) {
		return symbol.valueDeclaration;
	}

	if (symbol.declarations) {
		return symbol.declarations[0];
	}

	if (symbol.type && symbol.type.symbol) {
		return findTypeDeclaration(symbol.type.symbol);
	}

	return;
}

function getEnumTypeOptions(declaration: ts.EnumDeclaration): Option[] {
	return declaration.members.map((enumMember, index) => {
		const enumMemberId = enumMember.name.getText();
		let enumMemberName = getJsDocValue(enumMember, 'name');
		if (enumMemberName === undefined) {
			enumMemberName = enumMemberId;
		}
		const enumMemberOrdinal: number = enumMember.initializer
			? parseInt(enumMember.initializer.getText(), 10)
			: index;

		return new Option(enumMemberId, enumMemberName, enumMemberOrdinal);
	});
}

function getJsDocValue(node: ts.Node, tagName: string): string | undefined {
	const jsDocTags: ReadonlyArray<ts.JSDocTag> | undefined = ts.getJSDocTags(node);
	let result: string | undefined;
	if (jsDocTags) {
		jsDocTags.forEach(jsDocTag => {
			if (jsDocTag.tagName && jsDocTag.tagName.text === tagName) {
				if (result === undefined) {
					result = '';
				}
				result += ` ${jsDocTag.comment}`;
			}
		});
	}

	return result === undefined ? undefined : result.trim();
}
