// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AnalyticsElement, FunnelConfig, FunnelSubStepConfig, Handler } from '../interfaces';
import { getFunnelSubsteps, isInComponent, isInDialog } from '../utils/browser';
import { getLastBreadcrumbText, getModalHeaderText } from '../utils/page';
import { Funnel, FunnelStep } from '../funnel';
import { funnelCache } from '../cache';
import { getFunnel } from '../utils/funnel';

export const mount: Handler = event => {
  const isEmbeddedFunnel = isInComponent(event.target, 'Form') || isInComponent(event.target, 'Wizard');

  // Ignore embedded funnels
  if (isEmbeddedFunnel) {
    return;
  }

  const isInModal = isInComponent(event.target, 'Modal') || isInDialog(event.target);
  const funnelName = (isInModal ? getModalHeaderText() : getLastBreadcrumbText()) || 'Unknown funnel';
  const funnelType = isInModal ? 'modal' : 'single-page';

  const analyticsElement = event.target as AnalyticsElement;

  const stepConfiguration: FunnelConfig['stepConfiguration'] = [{ name: funnelName, number: 1, isOptional: false }];
  const funnelConfig: FunnelConfig = {
    name: funnelName,
    type: funnelType,
    stepConfiguration,
  };

  analyticsElement.setAttribute('data-analytics-node', 'funnel');
  analyticsElement.__analytics__ = funnelConfig;

  // Mount Step
  const funnelStep = new FunnelStep(stepConfiguration[0]);
  const substepElems = getFunnelSubsteps(analyticsElement);
  substepElems.forEach((substepElem, index) => {
    (substepElem.__analytics__ as FunnelSubStepConfig).number = index + 1;
  });

  const substepConfigs = substepElems.map(substepElem => substepElem.__analytics__);
  funnelStep.registerSubsteps(substepConfigs);

  const funnel = new Funnel(funnelConfig);
  funnel.steps = [funnelStep];

  funnelCache.set(analyticsElement, funnel);
};

export const unmount: Handler = ({ target }) => {
  const funnel = getFunnel(target);
  if (!funnel) {
    console.warn('Could not find funnel for form unmount');
    return;
  }

  funnel.complete();
  funnelCache.delete(target);
};

export const error: Handler = ({ target }) => {
  const funnel = getFunnel(target);
  if (!funnel) {
    console.warn('Could not find funnel for form unmount');
    return;
  }

  funnel.activeStep?.error();
  funnel.error();
};

export const submit: Handler = ({ target }) => {
  const funnel = getFunnel(target);
  if (!funnel) {
    console.warn('No funnel object associated with form element');
    return;
  }

  funnel.submit();
};
