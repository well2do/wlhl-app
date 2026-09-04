import { aboutContent } from "./about-content";
import type { ExpertProfileRecord } from "./types";

type SeedExpertProfile = Omit<ExpertProfileRecord, "created_at" | "updated_at">;

const expertIds = [
  "liu-meichang",
  "qiu-qiyu",
  "shao-fu",
  "jin-jiahua",
  "wang-suhua",
  "zeng-chen",
  "xu-yi",
  "pang-jinzhong",
  "sun-zhuqing",
  "yu-jianguo",
] as const;

const suppliedExperts: SeedExpertProfile[] = expertIds.map((id, index) => {
  const english = aboutContent.en.experts[index];
  const chinese = aboutContent.cn.experts[index];
  return {
    id,
    name_en: english.name,
    name_cn: chinese.name,
    role_en: english.role,
    role_cn: chinese.role,
    biography_en: english.biography,
    biography_cn: chinese.biography,
    profile_url: "profileUrl" in english ? english.profileUrl || "" : "",
    sort_order: (index + 1) * 10,
    active: 1,
  };
});

const shenPeihong: SeedExpertProfile = {
  id: "shen-peihong",
  name_en: "Dr. Peihong Shen",
  name_cn: "申培红医生",
  role_en: "Health and wellness expert",
  role_cn: "康养专家",
  biography_en: "Dr. Shen is a member of the club’s health and wellness expert team. Additional professional biography details will be added after confirmation by the club.",
  biography_cn: "申培红医生是俱乐部康养专家组成员。详细专业简介将在俱乐部确认后补充。",
  profile_url: "",
  sort_order: 50,
  active: 1,
};

export const initialExpertProfiles = [
  ...suppliedExperts.slice(0, 4),
  shenPeihong,
  ...suppliedExperts.slice(4).map((expert) => ({ ...expert, sort_order: expert.sort_order + 10 })),
];
