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
         "campuscard",
         "food",
         "transport",
         "transfer",
       ],
     },
     {
       text: "老生常谈",
       icon: "fluent-emoji-flat:bookmark-tabs",
       collapsible: true,
       children: [
         "courses",
         "exams",
         "leave",
         "fitness",
         "clubs",
         "scholarship",
         "loan",
       ],
     },
     "services",
     "recharge",
     "reissue",
     "faq",
     "contact",
     {
       text: "聚合APP",
       icon: "fluent-emoji-flat:mobile-phone",
       link: "/xzitpocket/releases.html",
     },
   ],
   "/doc-updates": false,
   "/xzitpocket/": [
     "",
     "releases",
     "changelog",
   ],
});
