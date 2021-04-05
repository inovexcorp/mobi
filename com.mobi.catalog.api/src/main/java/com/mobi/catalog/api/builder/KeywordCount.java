package com.mobi.catalog.api.builder;

/*-
 * #%L
 * com.mobi.catalog.api
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

import com.mobi.rdf.api.Literal;

public class KeywordCount {
    private Literal keyword;
    private Integer recordCount;

    private KeywordCount(Builder builder) {
        this.keyword = builder.keyword;
        this.recordCount = builder.recordCount;
    }

    public Literal getKeyword() {
        return keyword;
    }

    public Integer getRecordCount() {
        return recordCount;
    }

    @Override
    public String toString() {
        return "KC(" + keyword + ", " + recordCount + ")";
    }

    public static class Builder {
        private Literal keyword;
        private Integer recordCount;

        public Builder keyword(Literal keyword) {
            this.keyword = keyword;
            return this;
        }

        public Builder count(Integer recordCount) {
            this.recordCount = recordCount;
            return this;
        }

        public KeywordCount build() {
            return new KeywordCount(this);
        }
    }
}
