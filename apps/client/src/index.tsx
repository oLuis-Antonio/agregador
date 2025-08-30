/* @refresh reload */
import { render } from "solid-js/web";
import "./index.css";
import App from "./App.tsx";
import { Route, Router } from "@solidjs/router";
import News from "./routes/News.tsx";

const root = document.getElementById("root");

render(
  () => (
    <Router root={App}>
      <Route path={["/", "/news"]} component={News} />
      <Route
        path="/about"
        component={() => {
          return <p>about</p>;
        }}
      />
      <Route
        path="/support"
        component={() => {
          return <p>support</p>;
        }}
      />
    </Router>
  ),
  root!
);
