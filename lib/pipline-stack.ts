import type { Construct } from "constructs";
import { Stack, StackProps, Stage, StageProps } from "aws-cdk-lib";
import { CodeBuildStep, CodePipeline, CodePipelineSource, ConnectionSourceOptions, FileSet } from "aws-cdk-lib/pipelines";
import { CdkDemoBotStack } from "./cdk-demo-bot-stack.js";

class CodeBuildStepWithPrimarySource extends CodeBuildStep {
  override get primaryOutput(): FileSet {
    return super.primaryOutput!;
  }
}

abstract class CodePipelineSourceWithPrimarySource extends CodePipelineSource {
  override get primaryOutput(): FileSet {
    return super.primaryOutput!;
  }

  static override connection(
    repoString: string,
    branch: string,
    props: ConnectionSourceOptions
  ): CodePipelineSourceWithPrimarySource {
    return CodePipelineSource.connection(
      repoString,
      branch,
      props
    ) as CodePipelineSourceWithPrimarySource;
  }
}

interface PipelineStackProps extends StackProps {
  scope?: string | undefined;
  stagingAccount: string;
  stagingRegion: string;
  productionAccount: string;
  productionRegion: string;
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, "CdkDemoBotPipeline", {
      synth: new CodeBuildStepWithPrimarySource("SynthStep", {
        input: CodePipelineSourceWithPrimarySource.connection(
          "dmitriy-borowskiy/cdk-demo-bot",
          "main",
          {
            connectionArn: `arn:aws:codestar-connections:us-west-2:276097718844:connection/be0a167b-3774-454c-98ec-f5a712019903
            `,
            triggerOnPush: true,
          }
        ),
        commands: [
          'npm install',
          `npm run -- cdk synth -a "npx ts-node --esm bin/pipeline.ts"`,
        ],
      })
    });

    pipeline.addStage(new CdkDemoBotDeployStage(this, "Staging", {
      scope: props.scope,
      env: {
        account: props.stagingAccount,
        region: props.stagingRegion,
      }
    }));

    pipeline.addStage(new CdkDemoBotDeployStage(this, "Production", {
      scope: props.scope,
      env: {
        account: props.productionAccount,
        region: props.productionRegion,
      }
    }));
  }
}

interface CdkDemoBotDeployStageProps extends StageProps {
  scope?: string | undefined;
}

class CdkDemoBotDeployStage extends Stage {
  constructor(scope: Construct, id: string, props: CdkDemoBotDeployStageProps) {
    super(scope, id, props);

    new CdkDemoBotStack(this, "CdkDemoBotStack", {
      stackName: `${props.scope ? `${props.scope}-` : ''}-${id}-cdk-demo-bot`,
      scope: props.scope || '',
    });
  }
}
