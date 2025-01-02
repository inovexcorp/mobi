package com.mobi.utils.cli.impl;

/*-
 * #%L
 * com.mobi.utils.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import com.mobi.utils.cli.api.ConfigRestoreOperation;
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
        service = { ConfigRestoreOperationHandler.class, RestoreOperationHandler.class}
)
public class ConfigRestoreOperationHandler extends AbstractRestoreOperationHandler<ConfigRestoreOperation> {
    private static Logger log = LoggerFactory.getLogger(ConfigRestoreOperationHandler.class);
    private List<ConfigRestoreOperation> restoreOperations = new ArrayList<>();

    @Reference(cardinality = ReferenceCardinality.MULTIPLE, policy = ReferencePolicy.DYNAMIC)
    public void addConfigRestoreOperation(ConfigRestoreOperation restoreOperation) {
        log.trace(String.format("Adding ConfigRestoreOperation [%s] to ConfigRestoreOperationHandler", restoreOperation.getClass()));
        restoreOperations.add(restoreOperation);
    }

    public void removeConfigRestoreOperation(ConfigRestoreOperation restoreOperation) {
        restoreOperations.remove(restoreOperation);
    }

    @Activate
    public void activate() {
        log.debug("ConfigRestoreOperationHandler started.");
    }

    @Override
    public List<ConfigRestoreOperation> getOperations(String artifactVersion) {
        return (List<ConfigRestoreOperation>) VersionRangeUtils.filterRestoreOperations(restoreOperations, artifactVersion);
    }
}
