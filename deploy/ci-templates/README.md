# Cross-repo deploy: build here → deploy from the ops repo

New container images are built in **this** repo. When one lands in GHCR on
`main` (or on a `vX.Y.Z` tag), we notify a **separate ops/deploy repo** with a
`repository_dispatch`, and that repo runs `helm upgrade` against the cluster.

```
 spectoncr (this repo)                         ops/deploy repo
 ─────────────────────                         ───────────────
 push to main / tag v*
   └─ docker-publish.yml
        ├─ build + push  ghcr.io/spectonio/spectoncr:<sha|version>
        └─ repository_dispatch ───────────────▶ deploy.yml
             event: spectoncr-image-published      on: repository_dispatch
             payload: {image, tag, digest,          └─ helm upgrade --install
                       sha, ref, environment}            oci://ghcr.io/spectonio/charts/spectoncr
                                                          --set registry.image.tag=<tag>
                                                          --set auth.image.tag=<tag>
```

The sender lives in [`.github/workflows/docker-publish.yml`](../../.github/workflows/docker-publish.yml)
(step **“Dispatch deploy to ops repo”**). The receiver is
[`deploy-on-image.yml`](./deploy-on-image.yml) — copy it into the deploy repo.

## Setup

### 1. In the deploy (ops) repo
1. Copy `deploy-on-image.yml` → `.github/workflows/deploy.yml`.
2. Add secrets:
   - `KUBECONFIG` — base64-encoded kubeconfig for the target cluster
     (`base64 -w0 ~/.kube/config`).
   - `GHCR_TOKEN` — *only if* the chart/images are private (PAT with
     `read:packages`).
3. Optional: create `acc` / `prod` GitHub **Environments** for approvals.

### 2. In this repo (spectoncr)
1. Create a token that can dispatch to the deploy repo:
   - Fine-grained PAT (or GitHub App) with **Contents: read-only? no** →
     **`repository_dispatch` requires `Contents: write`** on the deploy repo,
     *or* a classic PAT with the `repo` scope. Scope it to the deploy repo only.
2. Add it here as secret **`DEPLOY_DISPATCH_TOKEN`**
   (`gh secret set DEPLOY_DISPATCH_TOKEN`).
3. Add repo variable **`DEPLOY_REPO`** = `owner/deploy-repo`
   (`gh variable set DEPLOY_REPO --body 'spectonio/spectoncr-deploy'`).

Until both `DEPLOY_REPO` and `DEPLOY_DISPATCH_TOKEN` exist, the dispatch step
is a logged **no-op** — image builds are never blocked.

## Environments & tags
| Trigger                | Deploy tag        | Environment |
| ---------------------- | ----------------- | ----------- |
| push to `main`         | short commit SHA  | `acc`       |
| push tag `vX.Y.Z`      | `X.Y.Z`           | `prod`      |

`environment` maps to the Kubernetes namespace in the receiver. The image tag
is immutable (SHA or version), so a rollout pins an exact build rather than a
moving `:latest`.

## Manual deploy
From the deploy repo: **Actions → Deploy spectoncr → Run workflow**, then enter
a `tag` and pick an `environment`.

## Test the wiring
```bash
# From a machine with a token that can dispatch to the deploy repo:
gh api repos/<owner>/<deploy-repo>/dispatches \
  -f event_type=spectoncr-image-published \
  -F 'client_payload[tag]=latest' \
  -F 'client_payload[environment]=acc'
```
