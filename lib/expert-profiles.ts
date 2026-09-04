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

export const shenPeihongPlaceholderBiographyCn = "申培红医生是俱乐部康养专家组成员。详细专业简介将在俱乐部确认后补充。";

export const shenPeihongProfile: SeedExpertProfile = {
  id: "shen-peihong",
  name_en: "Professor Peihong Shen",
  name_cn: "申培红教授",
  role_en: "Clinical medicine, pathology, and cancer diagnostics",
  role_cn: "临床医学、病理学与肿瘤诊断",
  biography_en: [
    "Professor Peihong Shen is a professor of clinical medicine at Zhengzhou University, a chief physician in pathology, and a supervisor of master’s and doctoral students. She is a specially appointed academic discipline leader in medicine in Henan Province and has served as a visiting scholar at university-affiliated medical schools and hospitals in the United States and Australia.",
    "Her honors and academic appointments include being the first medical-team member to receive an honorary certificate from Ethiopia’s Ministry of Health; a specially appointed academic discipline leader in Henan Province; a young and middle-aged science and technology innovation talent under the Henan health program; a medical academic leader in Henan; leader of the Henan Department of Science and Technology’s key innovation team for breast-cancer pathological diagnosis and treatment; a Zhengzhou science and technology leader and outstanding professional; one of Henan Vocational College of Nursing’s Top Ten Research Figures; and the recipient of numerous provincial, departmental, and municipal individual awards. She has served consecutive terms as vice chair of the Pathology Committee of the Henan Medical Association; vice chair of the National Committee for Gene Technology Research and Application; a standing committee member of the China Pathology AI Committee for big-data and AI-assisted pathological diagnosis; a standing committee member of the Breast Cancer Marker Collaborative Group of the Chinese Anti-Cancer Association’s Tumor Marker Society; a member of the 13th International Exchange and Cooperation Working Committee of the Chinese Medical Association’s Pathology Branch; a long-serving member of the Chinese Pathologists Committee; a senior member of the Chinese Medical Doctor Association’s pathology specialty; a standing director of the National Association of Health Industry and Enterprise Management under the former National Health and Family Planning Commission; and vice chair of the Hospital Integrated Development Working Committee of the Chinese Society of Water Resources and Electric Power Medical Science and Technology. Her other roles have included committee appointments in tumor pathology and lymphoma with the Henan Anti-Cancer Association; membership in the inaugural Pathologists Branch of the Henan Medical Doctor Association; standing committee roles in the Henan oncology, geriatric oncology, and integrated esophageal-cancer specialty committees; membership in the Henan Medical Association’s medical research management committee; and service on the Henan Higher-Education Research Management Council. She has also served as a science and technology achievement review expert for Henan Province, an international expert in the Henan Department of Science and Technology’s high-level talent pool, an expert reviewer for Zhengzhou University’s senior professor evaluation panel, a pathology consultation expert for the Henan Anti-Cancer Association, the National Health Commission’s difficult-pathology remote consultation program, the Chinese Medical Association, and the Chinese Medical Doctor Association, and a multidisciplinary oncology consultation expert for the Henan Anti-Cancer Association. She is an invited reviewer and editorial-board member for multiple journals and an executive editorial-board member of the core journal Henan Medical Research, as well as a Ministry of Education reviewer of master’s and doctoral dissertations. Beyond pathology, she serves as vice chair of the dual standards committee on medicine-food homology and medicinal-diet formulas of the China Association for Promotion of International Science and Technology; an expert with the China Health Industry Association; a mentor in Zhengzhou University’s Ministry of Agriculture and Rural Affairs Head Goose training program; an expert in wellness-oriented rural-revitalization planning and development; vice president of the National Medical Intangible Cultural Heritage Community; vice president of the Henan Intellectual Property Protection Association; and a standing director of the Henan branch of the International Cultural Exchange Center.",
  ].join("\n\n"),
  biography_cn: [
    "郑州大学临床医学教授、病理学主任医师、硕博研究生导师，河南省医学特聘学科带头人，美国和澳洲多所大学医学院附属医院访问学者。",
    "荣誉及学术兼职：首位荣获埃塞卫生部荣誉证书医疗队员，河南省特聘学科带头人，河南省卫生工程中青年科技创新人才，河南省医学学术带头人，河南省科技厅创新型科技重点团队带头人《乳腺癌病理诊断和治疗团队》，郑州市科技领军人才，郑州市专业技术拔尖人才，河南护理职业学院“十佳科研人物”，多次获省厅市级个人先进。连任中华医学会河南省病理专委会副主委，全国基因技术研究与应用专委会副主委，中国病理AI（大数据计算人工智能病理诊断）专委会常委，中国抗癌协会肿瘤标志物学会乳腺癌标志物协作组常委，中华医学会病理分会第十三届国际交流合作工作委员会委员，中国病理工作者委员会长期委员，中国医师协会病理专业资深会员，国家卫计委全国卫生产业企业管理协会常务理事，中国水利电力医学科学技术学会医院综合发展工委会副主委，原河南省抗癌协会肿瘤病理专业及淋巴瘤专业委员，河南省医师协会病理医师分会第一届会员，河南省肿瘤学专委会常委，首届老年肿瘤专委会常委，河南省食管癌整合专业专委会常委，河南省医学会医学科研管理学委员，河南省高等院校科研管理理事会理事，河南省科技成果鉴定评审专家，河南省科技厅高层人才库国际性专家，郑州大学教授高评组评审专家，河南省抗癌协会肿瘤病理会诊中心会诊专家，中国卫生部疑难病理远程会诊专家等，多家杂志特邀审稿专家及编委，《河南医学研究杂志》（核心）常务编委，国家教育部硕博生毕业大论文评审专家，中华医学会和中国医师协会病理分会的病理会诊专家，河南省抗癌协会肿瘤多学科MDT会诊专家。中国国际科技促进会“药食同源及药膳配方”双标委副主委，中国健康产业协会专家，中国农村农业部郑州大学头雁培训导师，康养乡村振兴策划建设专家，全国医药非遗共同体副会长，河南省知识产权保护协会副会长，国际文化交流中心河南省分中心常务理事等。",
  ].join("\n\n"),
  profile_url: "",
  sort_order: 50,
  active: 1,
};

export const initialExpertProfiles = [
  ...suppliedExperts.slice(0, 4),
  shenPeihongProfile,
  ...suppliedExperts.slice(4).map((expert) => ({ ...expert, sort_order: expert.sort_order + 10 })),
];
