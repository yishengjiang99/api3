// import { resolve } from "path";
// import { createElement } from "react";
// import { renderToNodeStream, renderToString } from "react-dom/server";
// import { readFileSync } from "fs";
// import { loginUrl, SDK, authTokenFromCode } from "./sdk";
// import transformReactJsx from "@babel/plugin-transform-react-jsx/lib";
// import {
//   createTemplateTags,
//   RegisterTokenIds,
//   TagRenderer,
// } from "@xarc/tag-renderer";

// const critcss = [
//   readFileSync(resolve(__dirname, "mui.min.css")),
//   readFileSync(resolve(__dirname, "template.css")),
// ].join("");

// const onHttp = async function (req, res) {
//   let accessToken =
//     req.query.access_token ||
//     (req.query.code && (await authTokenFromCode(req.query.code)));
//   const sdk = SDK({ accessToken });
//   let playlists;

//   const tagrenderer: TagRenderer = new TagRenderer({
//     templateTags: createTemplateTags/*html*/ `
//     <!DOCTYPE html>
//       <html>
//         <head>
// =        <style>${critcss}</style>
//        </head>
//        <body>
//        ${renderToString(
//       createElement(AppBarTop, {
//         accessToken: accessToken,
//         loginUrl: loginUrl(32),
//       })
//     )}
//       <div id='sidenav'>
//       ${async () => {
//         sdk.fetchAPI("/me/playlists").then((_res) => {
//           playlists = _res;
//           const rcstream = renderToNodeStream(
//             createElement("div", {
//               playlists: [].concat(playlists && playlists.items),
//             })
//           );
//           res.pipe(rcstream);
//         });
//       }}
//       </div>
//       <div id='main'>
//       ${() => {
//         sdk
//           .fetchAPI("/playlists/" + playlists.items[0].id + "/tracks")
//           .then((songs) => {
//             const output = renderToNodeStream(
//               createElement("div", { songs: songs }, [])
//             );
//             res.pipe(output);
//           });
//       }}
//       </div>
//       </body>
//       </html>
//       `,
//   });
//   tagrenderer.initializeRenderer();
//   tagrenderer.render({});
// };

// const express = require("express"); // Express web server framework
// const router = express.Router();

// router.use("/", onHttp);

// export default router;
