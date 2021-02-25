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

public class CSV_range_item {
    private int strings = 0;
    private int integers = 0;
    private int doubles = 0;
    private int booleans = 0;

    public CSV_range_item(String token){
        if (token.toLowerCase() == "false" || token.toLowerCase() == "true") {
            booleans++;
        } else if ( isInteger(token) != 0) {
            integers++;
        } else if ( isDouble(token) != 0) {
            doubles++;
        } else {strings++;}
    }

    public String getRangeType() {
        String type;

        if ((integers > strings) && (integers > doubles) && (integers > booleans)) {
            type = "integer";
        } else if ((doubles > integers) && (doubles > strings) && (doubles > booleans)) {
            type = "double";
        } else if ((booleans > integers) && (booleans > doubles) && (booleans > strings)) {
            type = "boolean";
        } else { type = "string";}

        return type;
    }

    private int isInteger(String input) {
        int number;
        try {
            number = Integer.parseInt(input);
            return number;
        } catch (NumberFormatException e) {
            number = 0;
            return number;
        }
    }

    private double isDouble(String input) {
        double number;
        try {
            number = Double.parseDouble(input);
            return number;
        } catch (NumberFormatException e) {
            number = 0;
            return number;
        }
    }
}
