import { PatternIdentifier } from '../../pattern/pattern-identifier';
import { StringProperty } from '../../pattern/property/string-property';
import { SyntheticPattern } from './synthetic-pattern';

export function createTextPattern(id: PatternIdentifier): SyntheticPattern {
	const pattern = new SyntheticPattern();

	pattern.id = id;
	pattern.name = 'text';

	const textProperty = new StringProperty('text');

	pattern.properties.set(textProperty.getId(), textProperty);

	return pattern;
}
