package com.benchmarking.rest.web;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.benchmarking.rest.repository.CategoryRepository;
import com.benchmarking.rest.repository.ItemRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
class CategoryItemIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ItemRepository itemRepository;

    @BeforeEach
    void clean() {
        itemRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    void shouldCreateCategoryAndItemAndRetrieveByCategory() throws Exception {
        String categoryPayload = """
                {
                  "code": "CAT-001",
                  "name": "Catégorie démo"
                }
                """;

        MvcResult categoryResult = mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(categoryPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("CAT-001"))
                .andReturn();

        JsonNode categoryJson = objectMapper.readTree(categoryResult.getResponse().getContentAsString());
        long categoryId = categoryJson.get("id").asLong();

        String heavyDescription = "Description lourde de test ".repeat(50);

        String itemPayload = objectMapper.createObjectNode()
                .put("sku", "SKU-001")
                .put("name", "Article démo")
                .put("price", new BigDecimal("19.99"))
                .put("stock", 50)
                .put("categoryId", categoryId)
                .put("description", heavyDescription)
                .toString();

        mockMvc.perform(post("/api/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(itemPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sku").value("SKU-001"))
                .andExpect(jsonPath("$.categoryId").value(categoryId));

        MvcResult listResult = mockMvc.perform(get("/api/items")
                        .param("categoryId", String.valueOf(categoryId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].sku").value("SKU-001"))
                .andReturn();

        JsonNode listJson = objectMapper.readTree(listResult.getResponse().getContentAsString());
        assertThat(listJson.get("content")).hasSize(1);
    }
}

