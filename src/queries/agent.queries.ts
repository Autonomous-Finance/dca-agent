import { arweaveNet, goldsky } from "./graphqlClient"
import { gql } from "urql"

export type Agent = {
  processId: string,
  created?: number,
}

const AgentQuery = gql`
  query ($initializerId: String!)  {
    transactions(
      tags: [
        { name: "Process-Type", values: ["AF-DCA-Agent"] }
        { name: "Initializer", values: [$initializerId]}
      ]
      first: 1,
      sort: HEIGHT_DESC
    ) {
    
      edges {
        node {
          id
          block {
            timestamp
            height
          }
          tags {
            name
            value
          }
        }
      }
    }
  }
`

export async function getLatestAgentInitilizedBy(initializerId: string): Promise<Agent> {
  const result = await arweaveNet
    .query(AgentQuery, { initializerId })
    .toPromise()
  const { data } = result
  return edgeToAgent(data.transactions.edges[0]);
}

function edgeToAgent(edge: any): Agent {
  const node = edge.node
  const processId = node.id
  // const created = node.timestamp * 1000

  return { processId }
}