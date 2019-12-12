(window.webpackJsonp=window.webpackJsonp||[]).push([[6],{Bh3R:function(e,n,a){"use strict";a.r(n),a.d(n,"default",(function(){return b}));var t=a("kOwS"),r=a("qNsG"),o=a("q1tI"),i=a.n(o),s=a("E/Ix"),p=a("xFV3"),l=(i.a.createElement,{}),c=Object(p.a)({layout:"Article",title:"GraphQL.js: Preparing for v14.0.0",date:new Date("2018-04-02T19:44:14.676Z"),published:!0,medium:"https://medium.com/@leeb/graphql-js-preparing-for-v14-0-0-839f823c144e",tags:["JavaScript","GraphQL"],slug:"graphql-js-preparing-for-v14",wordCount:633,synopsis:"Since it\u2019s open sourcing almost three years ago, GraphQL.js has followed a \u201cpre-major\u201d version scheme. The most recent release was . The next release will move to a proper semver major version as . I need your help to prepare.",__resourcePath:"graphql-js-preparing-for-v14.mdx",__scans:{}});function b(e){var n=e.components,a=Object(r.a)(e,["components"]);return Object(s.b)(c,Object(t.a)({},l,a,{components:n,mdxType:"MDXLayout"}),Object(s.b)("p",null,"Since it\u2019s open sourcing almost three years ago, GraphQL.js has followed a \u201cpre-major\u201d version scheme. The most recent release was ",Object(s.b)("inlineCode",{parentName:"p"},"v0.13.2"),". The next release will move to a proper semver major version as ",Object(s.b)("inlineCode",{parentName:"p"},"v14.0.0"),". I need your help to prepare."),Object(s.b)("h2",null,"What happened to v1.0.0?"),Object(s.b)("p",null,"Versions serve two purposes: a way people can talk about a project\u2019s progress as well as a way software can express dependencies. The ",Object(s.b)("a",Object(t.a)({parentName:"p"},{href:"https://semver.org/"}),"semver spec")," makes it clear that major version zero means an API is unstable and can change; moving to major versions indicates the beginning of a stable API. However people place meaning the progression of version numbers and can have preconceived notions of version 1.0 as the \u201cbeginning\u201d or as a significant break from what came before."),Object(s.b)("p",null,"However GraphQL.js has held a stable API and has been depended upon by many in production for quite some time. While moving to major versions fits better with this reality, it does not reflect any significant break from what came before. Other than this versioning change, there will be few if any breaking changes in this next release. Moving from v0.13 to v14.0 will help people see, understand, and talk about the change as a natural progression rather than a significant break."),Object(s.b)("h2",null,"Duplicate installs and peer dependencies"),Object(s.b)("p",null,"A common problem after a new version of GraphQL.js is released is finding some of your other dependencies (like Relay, GraphiQL, graphql-tools) support the new version at different times and can leave your node_modules directory with duplicate installs of GraphQL.js. In the past this led to difficult to track bugs while more recent versions present an error message with some guidance on resolving the situation."),Object(s.b)("p",null,"Attempting to support duplicate GraphQL.js installs simply trades one problem for another. Duplicate modules are almost never what is intended and could lead to oversized client bundles or subtle server errors. Instead, we should make it easier to ensure there is only one installation of GraphQL.js in your project. While asking devs to use ",Object(s.b)("a",Object(t.a)({parentName:"p"},{href:"https://docs.npmjs.com/cli/dedupe"}),Object(s.b)("inlineCode",{parentName:"a"},"npm dedupe"))," or ",Object(s.b)("a",Object(t.a)({parentName:"p"},{href:"https://yarnpkg.com/lang/en/docs/cli/install/#toc-yarn-install-flat"}),Object(s.b)("inlineCode",{parentName:"a"},"yarn install --flat"))," can help, library authors using ",Object(s.b)("a",Object(t.a)({parentName:"p"},{href:"https://nodejs.org/en/blog/npm/peer-dependencies/"}),Object(s.b)("inlineCode",{parentName:"a"},"peerDependencies"))," will help solve this problem."),Object(s.b)("h2",null,"Should my project use ",Object(s.b)("inlineCode",{parentName:"h2"},"peerDependencies"),"?"),Object(s.b)("p",null,Object(s.b)("inlineCode",{parentName:"p"},"peerDependencies")," should be used by ",Object(s.b)("em",{parentName:"p"},"companion libraries")," to GraphQL.js. However if your project is not deployed to NPM (perhaps it\u2019s a final product) or your project is a globally installed tool (like ",Object(s.b)("a",Object(t.a)({parentName:"p"},{href:"https://github.com/graphql-cli/graphql-cli"}),"graphql-cli"),") then the normal ",Object(s.b)("inlineCode",{parentName:"p"},"dependencies")," field is still appropriate."),Object(s.b)("p",null,"I need your help in updating GraphQL companion libraries to change to list GraphQL.js in their ",Object(s.b)("inlineCode",{parentName:"p"},"peerDependencies"),"."),Object(s.b)("p",null,Object(s.b)("img",Object(t.a)({parentName:"p"},{src:"https://cdn-images-1.medium.com/max/2204/1*LHshB-KUxwhp5ia3KzCScg.png",alt:"Here\u2019s a flow chart to help you decide if `peerDependencies` is right for you"}))),Object(s.b)("h2",null,"Supported version range"),Object(s.b)("p",null,"If your companion library changes to use ",Object(s.b)("inlineCode",{parentName:"p"},"peerDependencies"),", it\u2019s useful to describe the broadest range of support. Support whichever oldest version of GraphQL.js you confirm works, while including newest versions with ",Object(s.b)("inlineCode",{parentName:"p"},"||"),". After v14 is released (or even before!) your package.json might look like:"),Object(s.b)("pre",null,Object(s.b)("code",Object(t.a)({parentName:"pre"},{}),'"peerDependencies": {\n  "graphql": "^0.12.0 || ^0.13.0 || ^14.0.0"\n}\n')),Object(s.b)("h2",null,"Installation documentation"),Object(s.b)("p",null,"Finally, npm and yarn require ",Object(s.b)("inlineCode",{parentName:"p"},"peerDependencies")," to be manually installed. You might consider changing your library\u2019s installation to mention also installing GraphQL.js to avoid confusion. For example, your installation command might now look like:"),Object(s.b)("pre",null,Object(s.b)("code",Object(t.a)({parentName:"pre"},{}),"yarn add my-graphql-library graphql\n")),Object(s.b)("p",null,"With your help, companion libraries to GraphQL.js can switch to use ",Object(s.b)("inlineCode",{parentName:"p"},"peerDependencies")," and help mitigate the pains that come with upgrading the whole ecosystem to support newly released versions, and releasing GraphQL.js v14 will be smooth and painless!"),Object(s.b)("h2",null,"Development and ",Object(s.b)("inlineCode",{parentName:"h2"},"devDependencies")),Object(s.b)("p",null,Object(s.b)("inlineCode",{parentName:"p"},"peerDependencies")," are only installed explicitly by the end user. During development of your library you\u2019ll want to ensure the latest version of GraphQL.js you support is installed during ",Object(s.b)("inlineCode",{parentName:"p"},"npm install"),". To account for this, I recommend including ",Object(s.b)("em",{parentName:"p"},"both")," the latest supported version of GraphQL.js in your ",Object(s.b)("inlineCode",{parentName:"p"},"devDependencies")," (for development and tests) as well as the range of versions supported in ",Object(s.b)("inlineCode",{parentName:"p"},"peerDependencies")," (for end users)."))}b.isMDXComponent=!0},kGSD:function(e,n,a){(window.__NEXT_P=window.__NEXT_P||[]).push(["/graphql-js-preparing-for-v14",function(){return a("Bh3R")}])}},[["kGSD",0,1]]]);