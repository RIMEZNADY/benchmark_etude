package com.benchmarking.rest.mapper;

import org.springframework.stereotype.Component;

import com.benchmarking.rest.domain.Item;
import com.benchmarking.rest.dto.ItemRequest;
import com.benchmarking.rest.dto.ItemResponse;

@Component
public class ItemMapper {

    public void updateEntity(ItemRequest request, Item item) {
        item.setSku(request.getSku().trim());
        item.setName(request.getName().trim());
        item.setPrice(request.getPrice());
        item.setStock(request.getStock());
        item.setDescription(request.getDescription());
    }

    public ItemResponse toResponse(Item item) {
        ItemResponse response = new ItemResponse();
        response.setId(item.getId());
        response.setSku(item.getSku());
        response.setName(item.getName());
        response.setPrice(item.getPrice());
        response.setStock(item.getStock());
        response.setUpdatedAt(item.getUpdatedAt());
        response.setDescription(item.getDescription());
        if (item.getCategory() != null) {
            response.setCategoryId(item.getCategory().getId());
            response.setCategoryCode(item.getCategory().getCode());
        }
        return response;
    }
}

