import { EnumStatusCode } from '@wundergraph/cosmo-connect/dist/common/common_pb';
import CliTable3 from 'cli-table3';
import { Command, program } from 'commander';
import pc from 'picocolors';
import ora from 'ora';
import { baseHeaders } from '../../../core/config.js';
import { BaseCommandOptions } from '../../../core/types/types.js';
import Table from 'cli-table3';

export default (opts: BaseCommandOptions) => {
  const command = new Command('move');
  command.description('Moves the federated graph from one namespace to another.');
  command.argument('<name>', 'The name of the federated graph to move.');
  command.option('-n, --namespace [string]', 'The namespace of the federated graph.');
  command.requiredOption('-t, --to [string]', 'The new namespace of the federated graph.');
  command.action(async (name, options) => {
    const spinner = ora('Subgraph is being moved...').start();

    const resp = await opts.client.platform.moveFederatedGraph(
      {
        name,
        namespace: options.namespace,
        newNamespace: options.to,
      },
      {
        headers: baseHeaders,
      },
    );

    if (resp.response?.code === EnumStatusCode.OK) {
      spinner.succeed('Federated Graph has been moved successfully.');
    } else if (resp.response?.code === EnumStatusCode.ERR_SUBGRAPH_COMPOSITION_FAILED) {
      spinner.warn('Federated Graph has been moved but with composition errors.');

      const compositionErrorsTable = new CliTable3({
        head: [
          pc.bold(pc.white('FEDERATED_GRAPH_NAME')),
          pc.bold(pc.white('NAMESPACE')),
          pc.bold(pc.white('ERROR_MESSAGE')),
        ],
        colWidths: [30, 120],
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
        'Federated Graph was moved but the composition was not deployed due to admission webhook failures. Please check the errors below.',
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
      spinner.fail('Failed to move federated graph.');
      if (resp.response?.details) {
        console.error(pc.red(pc.bold(resp.response?.details)));
      }
      process.exit(1);
    }
  });

  return command;
};
