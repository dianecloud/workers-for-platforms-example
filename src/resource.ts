import Cloudflare from 'cloudflare';
import { toFile } from 'cloudflare/index';

export async function deployWorkerToNamespace(opts: {
  namespaceName: string;
  scriptName: string;
  code: string;
  accountId: string;
  apiToken: string;
  bindings?: Array<
    | { type: "plain_text"; name: string; text: string }
    | { type: "kv_namespace"; name: string; namespace_id: string }
    | { type: "r2_bucket"; name: string; bucket_name: string }
  >;
}) {
  const { namespaceName, scriptName, code, accountId, apiToken, bindings = [] } = opts;
  const cf = new Cloudflare({ apiToken });

  try {
    await cf.workersForPlatforms.dispatch.namespaces.get(namespaceName, {
      account_id: accountId,
    });
  } catch {
    await cf.workersForPlatforms.dispatch.namespaces.create({
      account_id: accountId,
      name: namespaceName,
    });
  }

  const moduleFileName = `${scriptName}.mjs`;

  await cf.workersForPlatforms.dispatch.namespaces.scripts.update(
    namespaceName,
    scriptName,
    {
      account_id: accountId,
      metadata: {
        main_module: moduleFileName,
        bindings,
      },
      files: [
        await toFile(new TextEncoder().encode(code), moduleFileName, {
          type: "application/javascript+module",
        }),
      ],
    }
  );

  return scriptName;
}

