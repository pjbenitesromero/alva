import { observer } from 'mobx-react';
import { Page } from '../../store/page/page';
import { PageElement } from '../../store/page/page-element';
import { PropertyValue } from '../../store/page/property-value';
import * as React from 'react';
import { ReactPattern } from '../../store/styleguide/typescript-react-analyzer/react-pattern';
import { SyntheticPattern } from '../../store/styleguide/synthetic-analyzer/synthetic-pattern';

class PatternWrapper extends React.Component<{}, PatternWrapperState> {
	public constructor(props: {}) {
		super(props);
		this.state = {};
	}

	public componentDidCatch(error: Error): void {
		this.setState({ errorMessage: error.message });
	}

	public render(): React.ReactNode {
		if (this.state.errorMessage) {
			return <span>{this.state.errorMessage}</span>;
		} else {
			return this.props.children;
		}
	}
}

export interface PreviewProps {
	page?: Page;
}

@observer
export class Preview extends React.Component<PreviewProps> {
	private patternFactories: { [id: string]: React.StatelessComponent | ObjectConstructor };

	public constructor(props: PreviewProps) {
		super(props);
		this.patternFactories = {};
	}

	public render(): JSX.Element | null {
		if (this.props.page) {
			return this.createComponent(this.props.page.getRoot()) as JSX.Element;
		}
		return null;
	}

	/**
	 * Converts a JSON-serializable declaration of a pattern, primitive, or collection
	 * into a React component (or primitive), deep-traversing through properties and children.
	 * @param value The value, may be a page element (a pattern declaration),
	 * a primitive like a string, number, boolean, null, etc.,
	 * or an array or object of such values.
	 * @returns A React component in case of a page element, the primitive in case of a primitive,
	 * or an array or object with values converted in the same manner, if an array resp. object is provided.
	 */
	private createComponent(value: PropertyValue, key?: string): JSX.Element | PropertyValue {
		if (value === undefined || value === null || typeof value !== 'object') {
			// Primitives stay primitives.
			return value;
		}

		if (value instanceof PageElement) {
			// The model is a page element, create a React pattern component

			// First, process the properties and children of the declaration recursively
			const pageElement: PageElement = value;
			if (!pageElement.getPattern()) {
				return null;
			}

			const pattern: ReactPattern | SyntheticPattern = pageElement.getPattern() as
				| ReactPattern
				| SyntheticPattern;

			if (pattern.id.analyzerId === 'synthetic') {
				switch (pattern.id.patternId) {
					case 'text':
						return pageElement.getPropertyValue('text');
				}
			}

			// tslint:disable-next-line:no-any
			const componentProps: any = {};
			pattern.properties.forEach(property => {
				componentProps[property.getId()] = this.createComponent(
					property.convertToRender(pageElement.getPropertyValue(property.getId())),
					property.getId()
				);
			});

			componentProps.children = pageElement
				.getChildren()
				.map((child, index) => this.createComponent(child, String(index)));

			// Then, load the pattern factory
			const reactPattern = pattern as ReactPattern;
			const patternPath: string = reactPattern.fileInfo.jsFilePath;
			let patternFactory: React.StatelessComponent | ObjectConstructor = this.patternFactories[
				reactPattern.id.globalId
			];
			if (patternFactory == null) {
				// tslint:disable-line
				const exportName = reactPattern.exportInfo.exportName || 'default';
				const module = require(patternPath);
				patternFactory = module[exportName];
				this.patternFactories[reactPattern.id.globalId] = patternFactory;
			}

			const reactComponent = React.createElement(patternFactory, componentProps);

			// Finally, build the component
			return <PatternWrapper key={key}>{reactComponent}</PatternWrapper>;
		} else {
			// The model is an object, but not a pattern declaration.
			// Create a new object with recursively processed values.

			// tslint:disable-next-line:no-any
			const result: any = {};
			Object.keys(value).forEach(objectKey => {
				// tslint:disable-next-line:no-any
				result[objectKey] = this.createComponent((value as any)[objectKey]);
			});
			return result;
		}
	}
}

interface PatternWrapperState {
	errorMessage?: string;
}
