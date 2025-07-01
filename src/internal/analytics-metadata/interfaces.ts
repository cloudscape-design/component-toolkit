// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface GeneratedAnalyticsMetadata {
  // action that the user performs. For example: "select".
  action: string;

  //detail of the action. For example: label and href of a link
  detail: Record<string, string>;

  // array of contexts in which the interaction happened, starting from the component and going up in the hierarchy of components
  contexts: Array<GeneratedAnalyticsMetadataComponentContext>;
}

export interface GeneratedAnalyticsMetadataComponent {
  // name of the component. For example: "awsui.RadioGroup". We prefix the actual name with awsui to account for future tagging of custom components
  name: string;

  // captured label of the component. For example: label of the input field
  label: string;

  // some components offer this property to identify them
  instanceIdentifier?: string;

  // relevant properties of the component. For example: {variant: 'primary'} for Button, {external: 'true', href: '...'} for Link
  properties?: Record<string, string>;

  // relevant information on the specific area of the component in which the interaction happened
  innerContext?: Record<string, string>;
}

interface GeneratedAnalyticsMetadataComponentContext {
  type: 'component';
  detail: GeneratedAnalyticsMetadataComponent;
}

export interface LabelIdentifier {
  selector?: string | Array<string>;
  root?: 'component' | 'self' | 'body';
  rootSelector?: string;
}

export interface GeneratedAnalyticsMetadataFragment extends Omit<Partial<GeneratedAnalyticsMetadata>, 'detail'> {
  detail?: Record<string, string | LabelIdentifier>;
  component?: Omit<Partial<GeneratedAnalyticsMetadataComponent>, 'innerContext' | 'label'> & {
    label?: string | LabelIdentifier;
    innerContext?: Record<string, string | LabelIdentifier>;
  };
}
