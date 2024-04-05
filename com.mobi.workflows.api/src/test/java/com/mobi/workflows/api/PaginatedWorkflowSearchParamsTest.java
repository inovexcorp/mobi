package com.mobi.workflows.api;

/*-
 * #%L
 * com.mobi.workflows.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import org.junit.Assert;
import org.junit.Test;

public class PaginatedWorkflowSearchParamsTest {

    @Test
    public void builderTest() {
        PaginatedWorkflowSearchParams params = new PaginatedWorkflowSearchParams.Builder()
                .searchText("searchText")
                .status("success")
                .startingAfter("2024-02-13T10:51:53.329402-05:00")
                .endingBefore("2024-02-13T10:52:03.485469-05:00")
                .offset(5)
                .limit(10)
                .sortBy("title")
                .ascending(false)
                .build();
        Assert.assertEquals("[]", params.validate().toString());
        Assert.assertTrue(params.getSearchText().isPresent());
        Assert.assertEquals("searchText", params.getSearchText().get());
        Assert.assertTrue(params.getStatus().isPresent());
        Assert.assertEquals("success", params.getStatus().get());
        Assert.assertTrue(params.getStartingAfter().isPresent());
        Assert.assertEquals("2024-02-13T10:51:53.329402-05:00", params.getStartingAfter().get());
        Assert.assertTrue(params.getEndingBefore().isPresent());
        Assert.assertEquals("2024-02-13T10:52:03.485469-05:00", params.getEndingBefore().get());
        Assert.assertEquals(5, params.getOffset());
        Assert.assertTrue(params.getLimit().isPresent());
        Assert.assertEquals((Integer) 10, params.getLimit().get());
        Assert.assertTrue(params.getSortBy().isPresent());
        Assert.assertEquals("title", params.getSortBy().get());
        Assert.assertTrue(params.getAscending().isPresent());
        Assert.assertEquals(false, params.getAscending().get());
    }

    @Test
    public void validateLimitTest() {
        PaginatedWorkflowSearchParams params = new PaginatedWorkflowSearchParams.Builder().limit(-1).build();
        Assert.assertEquals("[Limit cannot be negative.]", params.validate().toString());
    }

    @Test
    public void validateOffsetTest() {
        PaginatedWorkflowSearchParams params = new PaginatedWorkflowSearchParams.Builder().offset(-1).build();
        Assert.assertEquals("[Offset cannot be negative.]", params.validate().toString());
    }

    @Test
    public void validateStartingAfterInvalidTest() {
        PaginatedWorkflowSearchParams params = new PaginatedWorkflowSearchParams.Builder().startingAfter("invalid").build();
        Assert.assertEquals("[startingAfter datetime can't be parsed.]", params.validate().toString());
    }

    @Test
    public void validateEndingBeforeInvalidTest() {
        PaginatedWorkflowSearchParams params = new PaginatedWorkflowSearchParams.Builder().endingBefore("invalid").build();
        Assert.assertEquals("[endingBefore datetime can't be parsed.]", params.validate().toString());
    }

    @Test
    public void validateEndingBeforeInvalidYyyyMmDdTest() {
        PaginatedWorkflowSearchParams params = new PaginatedWorkflowSearchParams.Builder().endingBefore("2024-02-13").build();
        Assert.assertEquals("[endingBefore datetime can't be parsed.]", params.validate().toString());
    }

    @Test
    public void validateEndingBeforeValidUTCTest() {
        PaginatedWorkflowSearchParams params = new PaginatedWorkflowSearchParams.Builder().endingBefore("2024-02-13T10:51:53Z").build();
        Assert.assertEquals("[]", params.validate().toString());
    }
}
