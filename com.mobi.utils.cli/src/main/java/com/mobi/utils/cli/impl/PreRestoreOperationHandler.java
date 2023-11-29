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

import com.mobi.utils.cli.utils.VersionRangeUtils;
import com.mobi.utils.cli.api.AbstractRestoreOperationHandler;
import com.mobi.utils.cli.api.PreRestoreOperation;
import com.mobi.utils.cli.api.RestoreOperationHandler;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

@Component(
        service = { PreRestoreOperationHandler.class, RestoreOperationHandler.class}
)
/**
 * Operations performed within PreRestoreOperationHandler are done
 * before the data is cleared from the existing installation’s repositories,
 * but after the configuration file updates and are generic with no return
 */
public class PreRestoreOperationHandler extends AbstractRestoreOperationHandler<PreRestoreOperation> {
    private static Logger log = LoggerFactory.getLogger(PreRestoreOperationHandler.class);
    private List<PreRestoreOperation> restoreOperations = new ArrayList<>();

    @Reference(cardinality = ReferenceCardinality.MULTIPLE, policy = ReferencePolicy.DYNAMIC)
    public void addPreRestoreOperation(PreRestoreOperation restoreOperation) {
        log.trace(String.format("Adding PreRestoreOperation [%s] to PreRestoreOperationHandler", restoreOperation.getClass()));
        restoreOperations.add(restoreOperation);
    }

    public void removePreRestoreOperation(PreRestoreOperation restoreOperation) {
        restoreOperations.remove(restoreOperation);
    }

    @Activate
    public void activate() {
        log.trace("PreRestoreOperationHandler started.");
    }

    @Override
    public List<PreRestoreOperation> getOperations(String artifactVersion) {
        return (List<PreRestoreOperation>) VersionRangeUtils.filterRestoreOperations(restoreOperations, artifactVersion);
    }
}
