package com.skillswap.skill.dto;

import java.util.List;

public class CategoryListResponse {

    private List<CategoryResponse> items;

    public CategoryListResponse() {
    }

    public CategoryListResponse(List<CategoryResponse> items) {
        this.items = items;
    }

    public List<CategoryResponse> getItems() {
        return items;
    }

    public void setItems(List<CategoryResponse> items) {
        this.items = items;
    }
}
