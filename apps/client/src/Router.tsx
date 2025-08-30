import { Router, Route } from "@solidjs/router";
import Home from "./routes/News";
import type { ParentComponent } from "solid-js";

export default (root: ParentComponent) => {
  return (
    <Router root={root}>
      <Route path="/" component={Home} />
    </Router>
  );
};
