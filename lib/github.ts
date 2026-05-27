// Requires: npm install @octokit/auth-app @octokit/rest
import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/rest'

// Create an authenticated Octokit instance for a specific installation
export async function getInstallationOctokit(installationId: number) {
  const token = await getInstallationToken(installationId)
  return new Octokit({ auth: token })
}

/** Short-lived installation access token (used for git clone in Modal + API routes). */
export async function getInstallationToken(installationId: number): Promise<string> {
  const auth = createAppAuth({
    appId: process.env.GITHUB_APP_ID!,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    installationId,
  })
  const { token } = await auth({ type: 'installation' })
  return token
}

// Get the repo clone URL using installation token
export async function getCloneUrl(installationId: number, repoFullName: string): Promise<string> {
  const octokit = await getInstallationOctokit(installationId)
  const [owner, repo] = repoFullName.split('/')
  const { data } = await octokit.repos.get({ owner, repo })
  return data.clone_url
}
