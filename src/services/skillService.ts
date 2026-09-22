import { Skill, SkillCategory } from "@/types";
import { POPULAR_SKILLS } from "@/data/mockData";

export const skillService = {
  async getSkills(category: SkillCategory | "All" = "All"): Promise<Skill[]> {
    const list: Skill[] = POPULAR_SKILLS.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      icon: s.icon,
      learnersCount: s.learners,
      badgeColor: s.badgeColor,
    }));

    if (category === "All") {
      return Promise.resolve(list);
    }
    return Promise.resolve(list.filter((s) => s.category === category));
  },

  async searchSkills(query: string): Promise<Skill[]> {
    const list = await this.getSkills();
    const q = query.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    );
  },
};
