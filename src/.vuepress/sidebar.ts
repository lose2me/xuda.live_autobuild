import { sidebar } from "vuepress-theme-hope";

export default sidebar({
   "/guide/": [
     "",
     {
       text: "新生知道",
       icon: "fluent-emoji-flat:graduation-cap",
       collapsible: true,
       children: [
         "score",
         "checkin",
         "dorm",
         "items",
         "passwords",
         "network",
         "food",
         "election",
         "transfer",
         "faq",
         "contact",
       ],
     },
     {
       text: "老生常谈",
       icon: "fluent-emoji-flat:bookmark-tabs",
       collapsible: true,
       children: [
         "services",
         "leave",
         "fitness",
         "scholarship",
         "loan",
       ],
     },
   ],
   "/doc-updates": false,
   "/xzitpocket/": [
     "",
     "releases",
     "changelog",
   ],
});
