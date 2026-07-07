import { ResearchState } from "../graph/state";

export function reportWriter(state: typeof ResearchState.State) {
  console.log("Writing..");
  let report = "report";

  return {
    report,
  };
}
