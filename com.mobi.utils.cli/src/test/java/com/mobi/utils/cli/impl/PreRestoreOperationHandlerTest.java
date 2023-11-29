package com.mobi.utils.cli.impl;

/*-
 * #%L
 * com.mobi.utils.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import com.mobi.utils.cli.CliTestUtils;
import com.mobi.utils.cli.api.PreRestoreOperation;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockitoAnnotations;

import java.util.List;

import static com.mobi.utils.cli.CliTestUtils.ofRestoreOperation;

public class PreRestoreOperationHandlerTest {
    private AutoCloseable closeable;
    private PreRestoreOperationHandler handler;

    @Before
    public void setupMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        handler = new PreRestoreOperationHandler();
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    @Test
    public void getOperationsTest()  {
        PreRestoreOperation op112 = (PreRestoreOperation) CliTestUtils.mockRestoreOperation(PreRestoreOperation.class,"(,1.12]", 1);
        PreRestoreOperation op119 = (PreRestoreOperation) CliTestUtils.mockRestoreOperation(PreRestoreOperation.class,"(,1.19)", 2);
        PreRestoreOperation op200 = (PreRestoreOperation) CliTestUtils.mockRestoreOperation(PreRestoreOperation.class,"(,2.0)", 3);
        handler.addPreRestoreOperation(op112);
        handler.addPreRestoreOperation(op119);
        handler.addPreRestoreOperation(op200);
        List<PreRestoreOperation> filteredOperations1 = handler.getOperations("1.12");
        Assert.assertEquals(ofRestoreOperation(op112, op119, op200), filteredOperations1);
    }

}
