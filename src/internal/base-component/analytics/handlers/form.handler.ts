// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AnalyticsElement, Handler } from '../interfaces';
import { isInComponent } from '../utils/browser';
import { getModalFunnelName, getSinglePageFunnelName } from '../utils/funnel';
import { Funnel, FunnelStep } from '../funnel';
import { getFunnelFromParentNode } from '../helpers';

export const mount: Handler = event => {
  const isEmbeddedFunnel = isInComponent(event.target, 'Form') || isInComponent(event.target, 'Wizard');

  // Ignore embedded funnels
  if (isEmbeddedFunnel) {
    return;
  }

  const isInModal = isInComponent(event.target, 'Modal');
  const funnelName = (isInModal ? getModalFunnelName() : getSinglePageFunnelName()) || 'Unknown funnel';
  const funnelType = isInModal ? 'modal' : 'single-page';

  const analyticsElement = event.target as AnalyticsElement;

  const funnel = new Funnel({ funnelName, funnelType });
  const funnelStep = new FunnelStep({ name: funnelName, number: 1, isOptional: false });

  const substepNodes = Array.from(
    analyticsElement.querySelectorAll('[data-analytics-node="substep"]')
  ) as AnalyticsElement[];
  const substeps = substepNodes.map(node => node.__analytics__);

  for (const substep of substeps) {
    substep.setScope(funnelStep, substeps.indexOf(substep) + 1);
  }

  funnelStep.substeps = substeps;

  funnel.steps.push(funnelStep);
  funnel.setActiveStep(funnelStep);
  funnel.start();

  analyticsElement.setAttribute('data-analytics-node', 'funnel');
  analyticsElement.__analytics__ = funnel;
};

export const unmount: Handler = event => {
  const funnel = getFunnelFromParentNode(event.target);
  if (!funnel) {
    console.warn('Could not find funnel for form unmount');
    return;
  }

  funnel.complete();
};

export const error: Handler = event => {
  const funnel = getFunnelFromParentNode(event.target);
  if (!funnel) {
    console.warn('Could not find funnel for form unmount');
    return;
  }

  // const errorText = (event.detail as any).errorText;
  // funnel.activeStep?.error(errorText);
  // funnel.error(errorText);
};

export const submit: Handler = event => {
  const funnel = getFunnelFromParentNode(event.target);
  if (!funnel) {
    console.warn('Could not find funnel for form unmount');
    return;
  }

  funnel.submit();
};
