package com.benchmarking.rest.resource;

import com.benchmarking.rest.dto.CategoryRequest;
import com.benchmarking.rest.dto.CategoryResponse;
import com.benchmarking.rest.dto.ItemResponse;
import com.benchmarking.rest.service.CategoryService;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

@Component
@Path("/categories")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CategoryResource {

    private final CategoryService categoryService;

    public CategoryResource(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GET
    public Page<CategoryResponse> list(@QueryParam("page") @DefaultValue("0") int page,
                                       @QueryParam("size") @DefaultValue("20") int size) {
        return categoryService.list(PageRequest.of(page, size));
    }

    @GET
    @Path("/{id}")
    public CategoryResponse get(@PathParam("id") Long id) {
        return categoryService.get(id);
    }

    @POST
    public Response create(@Valid CategoryRequest request, @Context UriInfo uriInfo) {
        CategoryResponse created = categoryService.create(request);
        return Response.created(
                uriInfo.getAbsolutePathBuilder().path(created.getId().toString()).build()
        ).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public CategoryResponse update(@PathParam("id") Long id, @Valid CategoryRequest request) {
        return categoryService.update(id, request);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        categoryService.delete(id);
        return Response.noContent().build();
    }

    @GET
    @Path("/{id}/items")
    public Page<ItemResponse> listItems(@PathParam("id") Long id,
                                        @QueryParam("page") @DefaultValue("0") int page,
                                        @QueryParam("size") @DefaultValue("20") int size) {
        return categoryService.listItems(id, PageRequest.of(page, size));
    }
}

