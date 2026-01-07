package com.mobi.utils.cli.impl;

/*-
 * #%L
 * com.mobi.utils.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import com.mobi.utils.cli.api.PostRestoreOperation;
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
        service = {PostRestoreOperationHandler.class, RestoreOperationHandler.class}
)
/**
 * Operations in PostRestoreOperationHandler occurs after all the repository data has been restored are all
 * against specific repositories within the system, but could be more generally,
 * anything that needs to happen to the system before it is rebooted.
 */
public class PostRestoreOperationHandler extends AbstractRestoreOperationHandler<PostRestoreOperation> {
    private static Logger log = LoggerFactory.getLogger(PostRestoreOperationHandler.class);
    private List<PostRestoreOperation> restoreOperations = new ArrayList<>();

    @Reference(cardinality = ReferenceCardinality.MULTIPLE, policy = ReferencePolicy.DYNAMIC)
    public void addPostRestoreOperation(PostRestoreOperation restoreOperation) {
        log.trace(String.format("Adding PostRestoreOperation [%s] to PostRestoreOperationHandler", restoreOperation.getClass()));
        restoreOperations.add(restoreOperation);
    }

    public void removePostRestoreOperation(PostRestoreOperation restoreOperation) {
        restoreOperations.remove(restoreOperation);
    }

    @Activate
    public void activate() {
        log.trace("PostRestoreOperationHandler started.");
    }

    @Override
    public List<PostRestoreOperation> getOperations(String artifactVersion) {
        return (List<PostRestoreOperation>) VersionRangeUtils.filterRestoreOperations(restoreOperations, artifactVersion);
    }

}
