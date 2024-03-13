import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import Table from 'cli-table3';
import { Command, program } from 'commander';
import pc from 'picocolors';
import { EnumStatusCode } from '@wundergraph/cosmo-connect/dist/common/common_pb';
import { resolve } from 'pathe';
import { BaseCommandOptions } from '../../../core/types/types.js';
import { baseHeaders } from '../../../core/config.js';
import ora from 'ora';

export default (opts: BaseCommandOptions) => {
  const command = new Command('update');
  command.description('Updates a federated graph on the control plane.');
  command.argument('<name>', 'The name of the federated graph to update.');
  command.option('-n, --namespace [string]', 'The namespace of the federated graph.');
  command.option(
    '-r, --routing-url <url>',
    'The routing url of your router. This is the url that the router will be accessible at.',
  );
  command.option(
    '--label-matcher [labels...]',
    'The label matcher is used to select the subgraphs to federate. The labels are passed in the format <key>=<value> <key>=<value>. They are separated by spaces and grouped using comma. Example: --label-matcher team=A,team=B env=prod',
  );
  command.option(
    '--unset-label-matchers',
    'This will remove all label matchers. It will not add new label matchers if both this and --label-matchers option is passed.',
  );
  command.option('--readme <path-to-readme>', 'The markdown file which describes the subgraph.');
  command.action(async (name, options) => {
    let readmeFile;
    if (options.readme) {
      readmeFile = resolve(process.cwd(), options.readme);
      if (!existsSync(readmeFile)) {
        program.error(
          pc.red(
            pc.bold(`The readme file '${pc.bold(readmeFile)}' does not exist. Please check the path and try again.`),
          ),
        );
      }
    }

    const spinner = ora('Federated Graph is being updated...').start();
    const resp = await opts.client.platform.updateFederatedGraph(
      {
        name,
        namespace: options.namespace,
        routingUrl: options.routingUrl,
        labelMatchers: options.labelMatcher,
        unsetLabelMatchers: options.unsetLabelMatchers,
        readme: readmeFile ? await readFile(readmeFile, 'utf8') : undefined,
      },
      {
        headers: baseHeaders,
      },
    );

    if (resp.response?.code === EnumStatusCode.OK) {
      spinner.succeed(`Federated Graph was updated successfully.`);
    } else if (resp.response?.code === EnumStatusCode.ERR_SUBGRAPH_COMPOSITION_FAILED) {
      spinner.warn(`Federated Graph was updated but with composition errors.`);

      const compositionErrorsTable = new Table({
        head: [
          pc.bold(pc.white('FEDERATED_GRAPH_NAME')),
          pc.bold(pc.white('NAMESPACE')),
          pc.bold(pc.white('ERROR_MESSAGE')),
        ],
        colWidths: [30, 30, 120],
        wordWrap: true,
      });

      console.log(
        pc.yellow(
          'But we found composition errors, while composing the federated graph.\nThe graph will not be updated until the errors are fixed. Please check the errors below:',
        ),
      );
      for (const compositionError of resp.compositionErrors) {
        compositionErrorsTable.push([
          compositionError.federatedGraphName,
          compositionError.namespace,
          compositionError.message,
        ]);
      }
      // Don't exit here with 1 because the change was still applied
      console.log(compositionErrorsTable.toString());
    } else if (resp.response?.code === EnumStatusCode.ERR_ADMISSION_WEBHOOK_FAILED) {
      spinner.warn(
        'Federated Graph was updated but the composition was not deployed due to admission webhook failures. Please check the errors below.',
      );

      const admissionWebhookErrorsTable = new Table({
        head: [
          pc.bold(pc.white('FEDERATED_GRAPH_NAME')),
          pc.bold(pc.white('NAMESPACE')),
          pc.bold(pc.white('ERROR_MESSAGE')),
        ],
        colWidths: [30, 30, 120],
        wordWrap: true,
      });

      for (const admissionError of resp.admissionWebhookErrors) {
        admissionWebhookErrorsTable.push([
          admissionError.federatedGraphName,
          admissionError.namespace,
          admissionError.message,
        ]);
      }
      // Don't exit here with 1 because the change was still applied
      console.log(admissionWebhookErrorsTable.toString());
    } else {
      spinner.fail(`Failed to update federated graph.`);
      if (resp.response?.details) {
        console.log(pc.red(pc.bold(resp.response?.details)));
      }
      process.exit(1);
    }
  });

  return command;
};
