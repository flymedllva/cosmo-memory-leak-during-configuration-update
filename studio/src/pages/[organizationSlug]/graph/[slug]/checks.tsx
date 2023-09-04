import { EmptyState } from "@/components/empty-state";
import { GraphContext, getGraphLayout } from "@/components/layout/graph-layout";
import { PageHeader } from "@/components/layout/head";
import { TitleLayout } from "@/components/layout/title-layout";
import { SchemaViewer, SchemaViewerActions } from "@/components/schema-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CLI } from "@/components/ui/cli";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader } from "@/components/ui/loader";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { docsBaseURL } from "@/lib/constants";
import { NextPageWithLayout } from "@/lib/page";
import { cn } from "@/lib/utils";
import {
  CommandLineIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "next/router";
import {
  getCheckDetails,
  getChecksByFederatedGraphName,
} from "@wundergraph/cosmo-connect/dist/platform/v1/platform-PlatformService_connectquery";
import { EnumStatusCode } from "@wundergraph/cosmo-connect/dist/common_pb";
import { useContext } from "react";
import * as Diff from "diff";

const generateDiff = (original: string, newString: string): string => {
  const diff = Diff.diffLines(original, newString);

  let output = "";

  diff.forEach(function (part) {
    if (part.added) {
      const changedLines = part.value.split("\n");
      if (!changedLines[changedLines.length - 1]) changedLines.pop();
      output += changedLines.map((each) => `+ ${each}\n`).join("");
    } else if (part.removed) {
      const changedLines = part.value.split("\n");
      if (!changedLines[changedLines.length - 1]) changedLines.pop();
      output += changedLines.map((each) => `- ${each}\n`).join("");
    } else {
      const changedLines = part.value.split("\n");
      if (!changedLines[changedLines.length - 1]) changedLines.pop();
      output += changedLines.map((each) => `  ${each}\n`).join("");
    }
  });
  return output;
};

const Details = ({ id, graphName }: { id: string; graphName: string }) => {
  const { data, isLoading, error, refetch } = useQuery(
    getCheckDetails.useQuery({
      checkID: id,
      graphName,
    })
  );

  if (isLoading) return <Loader fullscreen />;

  if (error || data.response?.code !== EnumStatusCode.OK)
    return (
      <EmptyState
        icon={<ExclamationTriangleIcon />}
        title="Could not retrieve details"
        description={
          data?.response?.details || error?.message || "Please try again"
        }
        actions={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );

  if (!data) return null;

  return (
    <div className="space-y-4">
      {data.changes.length === 0 && data.compositionErrors.length == 0 && (
        <p>No changes or composition errors to show</p>
      )}
      {data.changes.length > 0 && (
        <div>
          <p className="text-sm font-semibold">Changes</p>
          <Separator className="my-2" />
          <div className="scrollbar-custom max-h-[70vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Change</TableHead>
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.changes.map(({ changeType, message, isBreaking }) => {
                  return (
                    <TableRow
                      key={changeType + message}
                      className={cn(isBreaking && "text-destructive")}
                    >
                      <TableCell>
                        {isBreaking ? "Breaking" : "Non-Breaking"}
                      </TableCell>
                      <TableCell>{changeType}</TableCell>
                      <TableCell>{message}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      {data.compositionErrors.length > 0 && (
        <div className="text-sm">
          <p className="font-semibold">Composition Errors</p>
          <Separator className="my-2" />
          <pre className="py-4">{data.compositionErrors.join("\n")}</pre>
        </div>
      )}
    </div>
  );
};

const DetailsDialog = ({
  id,
  graphName,
}: {
  id: string;
  graphName: string;
}) => {
  return (
    <Dialog>
      <DialogTrigger className="text-primary">View</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Details</DialogTitle>
        </DialogHeader>
        <Details id={id} graphName={graphName} />
      </DialogContent>
    </Dialog>
  );
};

const ProposedSchema = ({
  sdl,
  subgraphName,
}: {
  sdl: string;
  subgraphName: string;
}) => {
  return (
    <Dialog>
      <DialogTrigger className="text-primary">View</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schema</DialogTitle>
        </DialogHeader>
        <div className="scrollbar-custom h-[70vh] overflow-auto rounded border">
          <SchemaViewer sdl={sdl} showDiff={true} disableLinking />
        </div>
        <SchemaViewerActions sdl={sdl} subgraphName={subgraphName} />
      </DialogContent>
    </Dialog>
  );
};

const ChecksPage: NextPageWithLayout = () => {
  const router = useRouter();

  const getIcon = (check: boolean) => {
    if (check) {
      return (
        <div className="flex justify-center">
          <CheckCircledIcon className="h-4 w-4 text-success" />
        </div>
      );
    }
    return (
      <div className="flex justify-center">
        <CrossCircledIcon className="h-4 w-4 text-destructive" />
      </div>
    );
  };

  const graphContext = useContext(GraphContext);

  const { data, isLoading, error, refetch } = useQuery(
    getChecksByFederatedGraphName.useQuery({
      name: router.query.slug as string,
    })
  );

  if (isLoading) return <Loader fullscreen />;

  if (error || data.response?.code !== EnumStatusCode.OK)
    return (
      <EmptyState
        icon={<ExclamationTriangleIcon />}
        title="Could not retrieve federated graphs"
        description={
          data?.response?.details || error?.message || "Please try again"
        }
        actions={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );

  if (!data?.checks || !graphContext?.graph) return null;

  if (data.checks.length === 0)
    return (
      <EmptyState
        icon={<CommandLineIcon />}
        title="Run checks using the CLI"
        description={
          <>
            No checks found. Use the CLI tool to run one.{" "}
            <a
              target="_blank"
              rel="noreferrer"
              href={docsBaseURL + "/cli/subgraphs/check"}
              className="text-primary"
            >
              Learn more.
            </a>
          </>
        }
        actions={
          <CLI
            command={`npx wgc subgraph check users --schema users.graphql`}
          />
        }
      />
    );

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Timestamp</TableHead>
            <TableHead>Subgraph</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Composable</TableHead>
            <TableHead className="text-center">Non Breaking</TableHead>
            <TableHead className="text-center">Proposed Schema</TableHead>
            <TableHead className="text-center">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.checks.map(
            ({
              id,
              isBreaking,
              isComposable,
              subgraphName,
              timestamp,
              proposedSubgraphSchemaSDL,
              originalSchemaSDL,
            }) => {
              const output = generateDiff(
                originalSchemaSDL,
                proposedSubgraphSchemaSDL!
              );
              return (
                <TableRow key={id}>
                  <TableCell className="font-medium ">
                    {format(new Date(timestamp), "dd MMMM yyyy HH:mm")}
                  </TableCell>
                  <TableCell>{subgraphName}</TableCell>
                  <TableCell>
                    {isComposable && !isBreaking ? (
                      <Badge variant="success">PASSED</Badge>
                    ) : (
                      <Badge variant="destructive">FAILED</Badge>
                    )}
                  </TableCell>
                  <TableCell>{getIcon(isComposable)}</TableCell>
                  <TableCell>{getIcon(!isBreaking)}</TableCell>
                  <TableCell className="text-center">
                    {proposedSubgraphSchemaSDL ? (
                      <ProposedSchema
                        sdl={output}
                        subgraphName={subgraphName}
                      />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <DetailsDialog
                      id={id}
                      graphName={graphContext.graph?.name ?? ""}
                    />
                  </TableCell>
                </TableRow>
              );
            }
          )}
        </TableBody>
      </Table>
    </div>
  );
};

ChecksPage.getLayout = (page) =>
  getGraphLayout(
    <PageHeader title="Studio | Checks">
      <TitleLayout
        title="Checks"
        subtitle="Summary of composition and schema checks"
      >
        {page}
      </TitleLayout>
    </PageHeader>
  );

export default ChecksPage;
