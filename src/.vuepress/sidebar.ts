import { sidebar } from "vuepress-theme-hope";

export default sidebar({
   "/guide/": [
     "",
     {
       text: "新生知道",
       icon: "graduation-cap",
       collapsible: true,
       children: [
         "score",
         "faq",
         "items",
         "contact",
       ],
     },
     {
       text: "老生常谈",
       icon: "comments",
       collapsible: true,
       children: [],
     },
   ],
   "/xzitpocket/": [
     "",
     "releases",
     "changelog",
   ],
});
