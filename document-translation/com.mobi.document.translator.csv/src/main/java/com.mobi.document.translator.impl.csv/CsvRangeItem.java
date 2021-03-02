package com.mobi.document.translator.impl.csv;

/*-
 * #%L
 * com.mobi.document.translator.csv
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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

public class CsvRangeItem {
    private String type = null;

    public void checkTokenType(String token) {
        if (token.toLowerCase().equals("false") || token.toLowerCase().equals("true")) {
            compareTypes("boolean");
        } else if (checkNumber(token) == false) {
            compareTypes("string");
        }
    }

    public String getRangeType() {
        return this.type;
    }

    private void compareTypes(String currentType) {
        if (this.type == null) {
            this.type = currentType;
        } else if ((this.type.equals("integer") && currentType.equals("double")) || (this.type.equals("double") && currentType.equals("integer"))) {
            this.type = "double";
        } else if (this.type != currentType) {
            this.type = "string";
        }
    }

    private boolean checkNumber(String token) {
        try {
            double doubleCheck = Double.parseDouble(token);

            if (doubleCheck % 1 != 0) {
                compareTypes("double");
            } else {
                compareTypes("integer");
            }
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

}
