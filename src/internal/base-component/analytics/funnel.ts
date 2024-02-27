// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AnalyticsElement, FunnelConfig, FunnelStepConfig, FunnelSubStepConfig, FunnelType } from './interfaces';

type FunnelState = 'not-started' | 'in-progress' | 'submitting' | 'completed' | 'error' | 'cancelled';

export class FunnelSubstep {
  private element: AnalyticsElement;
  public name: string | undefined;
  public state: FunnelState = 'not-started';
  public scope: FunnelStep | undefined;
  public number: number | undefined;

  constructor(element: AnalyticsElement, config: FunnelSubStepConfig) {
    this.name = config.name;
    this.element = element;
  }

  start() {
    if (this.state === 'in-progress') {
      return;
    }

    console.log(
      'Funnel substep started',
      `${this.name} [${this.number}]`,
      `Scope: ${this.scope?.name}, ${this.scope?.number}]`
    );
    this.state = 'in-progress';
    this.element.__analytics__ = this;
  }

  complete() {
    if (this.state === 'completed') {
      return;
    }

    console.log(
      'Funnel substep completed',
      `${this.name} [${this.number}]`,
      `Scope: ${this.scope?.name}, ${this.scope?.number}]`
    );
    this.state = 'completed';
    this.element.__analytics__ = this;
  }

  setScope(funnelStep: FunnelStep, number: number) {
    this.scope = funnelStep;
    this.number = number;
    this.element.__analytics__ = this;
  }
}

export class FunnelStep {
  public number: number | undefined;
  public name: string | undefined;
  public isOptional: boolean | undefined;
  public substeps: FunnelSubstep[] = [];
  public state: FunnelState = 'not-started';
  public activeSubstep: FunnelSubstep | undefined | null;

  constructor(config: FunnelStepConfig) {
    this.number = config.number;
    this.name = config.name;
    this.isOptional = config.isOptional;
  }

  start() {
    console.log('Funnel step started', this.number, this.name);
  }

  complete() {
    this.activeSubstep?.complete();
    console.log('Funnel step completed', this.number, this.name);
  }

  setActiveSubstep(substep: FunnelSubstep) {
    if (this.activeSubstep === substep) {
      return;
    }

    this.activeSubstep?.complete();
    this.activeSubstep = substep;
    this.activeSubstep.start();
  }
}

export class Funnel {
  public version = '2.0';
  public name: string | undefined;
  public type: FunnelType | undefined;
  public steps: FunnelStep[] = [];
  public interactionId: string | undefined;
  public activeStep: FunnelStep | undefined | null;
  public state: FunnelState = 'not-started';

  constructor(config: FunnelConfig) {
    this.name = config.funnelName;
    this.type = config.funnelType;
  }

  start() {
    this.interactionId = 'funnel-interaction-id';
    console.log('Funnel started');
    this.state = 'in-progress';
    this.activeStep?.start();
  }

  complete() {
    this.activeStep?.complete();

    const funnelCompleteState = this.state === 'submitting' ? 'successful' : 'cancelled';
    this.state = 'completed';
    console.log('Funnel completed', funnelCompleteState);
  }

  cancel() {
    this.state = 'cancelled';
    console.log('Funnel cancelled');
  }

  submit() {
    this.state = 'submitting';
    console.log('Funnel submitting');
  }

  error() {
    this.state = 'error';
    console.log('Funnel errored');
  }

  setActiveStep(step: FunnelStep) {
    if (this.activeStep === step) {
      return;
    }

    this.activeStep = step;

    if (this.state === 'in-progress') {
      this.activeStep?.complete();
      this.activeStep.start();
    }
  }
}
