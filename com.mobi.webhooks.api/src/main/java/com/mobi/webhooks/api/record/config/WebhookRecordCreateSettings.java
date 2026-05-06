package com.mobi.webhooks.api.record.config;

/*-
 * #%L
 * com.mobi.webhooks.api
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

import com.mobi.catalog.api.record.config.OperationSetting;
import com.mobi.catalog.api.record.config.OperationSettingImpl;
import org.eclipse.rdf4j.model.Model;

/**
 * {@link com.mobi.webhooks.api.ontology.webhooks.WebhookRecord} create settings.
 */
public class WebhookRecordCreateSettings {

    /**
     * Optional RDF Model containing a WebhookConfiguration to use instead of defaults.
     */
    public static OperationSetting<Model> CONFIGURATION_MODEL;

    private WebhookRecordCreateSettings() {}

    static {
        CONFIGURATION_MODEL = new OperationSettingImpl<>("com.mobi.webhooks.operation.create.configurationmodel",
                "RDF Model containing the WebhookConfiguration data", null);
    }
}
