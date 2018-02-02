import { Styleguide } from '../styleguide';
import { StyleguideAnalyzer } from '../styleguide-analyzer';
import { SyntheticPattern } from './synthetic-pattern';

import { PatternIdentifier } from '../../pattern/pattern-identifier';
import * as patternFactories from './patterns';

export class SyntheticAnalyzer extends StyleguideAnalyzer<SyntheticPattern> {
	public readonly id: string = 'synthetic';
	public readonly styleguide: Styleguide;
	private readonly patterns: SyntheticPattern[] = [];

	public constructor(styleguide: Styleguide) {
		super();

		this.styleguide = styleguide;

		this.patterns = this.generateSyntheticPatterns();
	}

	public analyze(styleguide: Styleguide): SyntheticPattern[] {
		return this.patterns;
	}

	private generateSyntheticPatterns(): SyntheticPattern[] {
		return [
			patternFactories.createTextPattern(
				new PatternIdentifier({
					analyzerId: this.id,
					patternId: 'text',
					styleguideId: this.styleguide.id
				})
			)
		];
	}
}
