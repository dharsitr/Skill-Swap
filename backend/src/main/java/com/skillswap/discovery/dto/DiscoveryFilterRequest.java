package com.skillswap.discovery.dto;

import com.skillswap.discovery.entity.DiscoveryMode;
import com.skillswap.skill.entity.SkillProficiency;

import java.util.UUID;

public class DiscoveryFilterRequest {

    private DiscoveryMode mode = DiscoveryMode.GENERAL;
    private String search;
    private UUID skillId;
    private UUID categoryId;
    private SkillProficiency proficiency;
    private int page = 0;
    private int size = 10;
    private String sort = "score,desc";

    public DiscoveryFilterRequest() {
    }

    public DiscoveryFilterRequest(
            DiscoveryMode mode,
            String search,
            UUID skillId,
            UUID categoryId,
            SkillProficiency proficiency,
            int page,
            int size,
            String sort
    ) {
        if (mode != null) this.mode = mode;
        this.search = search;
        this.skillId = skillId;
        this.categoryId = categoryId;
        this.proficiency = proficiency;
        this.page = page;
        this.size = size;
        if (sort != null) this.sort = sort;
    }

    public DiscoveryMode getMode() {
        return mode;
    }

    public void setMode(DiscoveryMode mode) {
        this.mode = mode;
    }

    public String getSearch() {
        return search;
    }

    public void setSearch(String search) {
        this.search = search;
    }

    public UUID getSkillId() {
        return skillId;
    }

    public void setSkillId(UUID skillId) {
        this.skillId = skillId;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(UUID categoryId) {
        this.categoryId = categoryId;
    }

    public SkillProficiency getProficiency() {
        return proficiency;
    }

    public void setProficiency(SkillProficiency proficiency) {
        this.proficiency = proficiency;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public String getSort() {
        return sort;
    }

    public void setSort(String sort) {
        this.sort = sort;
    }
}
