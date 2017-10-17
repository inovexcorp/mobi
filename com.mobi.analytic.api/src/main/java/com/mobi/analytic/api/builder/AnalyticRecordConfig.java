package com.mobi.analytic.api.builder;

/*-
 * #%L
 * com.mobi.analytic.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import com.mobi.analytic.ontologies.analytic.Configuration;
import com.mobi.catalog.api.builder.RecordConfig;
import com.mobi.jaas.api.ontologies.usermanagement.User;

import java.util.Set;
import javax.annotation.Nonnull;

public class AnalyticRecordConfig extends RecordConfig {

    private Configuration configuration;

    private AnalyticRecordConfig(AnalyticRecordBuilder builder) {
        super(builder);
        this.configuration = builder.configuration;
    }

    public Configuration getConfiguration() {
        return configuration;
    }

    public static class AnalyticRecordBuilder extends Builder {
        private Configuration configuration;

        /**
         * The constructor for the AnalyticRecordBuilder.
         *
         * @param title         The title of the analytic record.
         * @param publishers    The {@link Set} of users publishing this analytic record.
         * @param configuration The {@link Configuration} associated with this analytic record.
         */
        public AnalyticRecordBuilder(String title, Set<User> publishers, @Nonnull Configuration configuration) {
            super(title, publishers);
            this.configuration = configuration;
        }

        public AnalyticRecordConfig build() {
            return new AnalyticRecordConfig(this);
        }
    }
}
